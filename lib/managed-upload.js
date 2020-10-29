import path from 'path-browserify';
import copy from 'copy-to';
import mime from 'mime';
import is from 'is-type-of';
import fs from 'fs';

/**
 * Multipart operations
 */

/**
 * Upload a file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File|Buffer} file
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url the OSS sends a callback request to this URL
 *        {String} options.callback.host The host header value for initiating callback requests
 *        {String} options.callback.body The value of the request body when a callback is initiated
 *        {String} options.callback.contentType The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 */
export async function multipartUpload(name, file, options = {}) {
  this.resetCancelFlag();

  if (!is.arrayBuffer(file)) {
    if (!options.mime) {
      options.mime = mime.getType(path.extname(file));
    }
    file = await new Promise((resolve, rejcet) => {
      fs.readFile({
        filePath: file,
        success: (res) => resolve(res.data),
        fail: rejcet,
      });
    });
  }

  if (options.checkpoint && options.checkpoint.uploadId) {
    options.checkpoint.file = file;

    return this._resumeMultipart(options.checkpoint, options);
  }

  const minPartSize = 100 * 1024;

  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  const fileSize = this._getFileSize(file);
  if (fileSize < minPartSize) {
    const stream = this._createStream(file, 0, fileSize);
    options.contentLength = fileSize;

    const result = await this.putStream(name, stream, options);
    if (options && options.progress) {
      await options.progress(1);
    }

    const ret = {
      res: result.res,
      bucket: this.options.bucket,
      name,
      etag: result.res.headers.etag,
    };

    if ((options.headers && options.headers['x-oss-callback']) || options.callback) {
      ret.data = result.data;
    }

    return ret;
  }
  if (options.partSize && !(parseInt(options.partSize, 10) === options.partSize)) {
    throw new Error('partSize must be int number');
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error(`partSize must not be smaller than ${minPartSize}`);
  }

  const initResult = await this.initMultipartUpload(name, options);
  const { uploadId } = initResult;
  const partSize = this._getPartSize(fileSize, options.partSize);

  const checkpoint = {
    file,
    name,
    fileSize,
    partSize,
    uploadId,
    doneParts: [],
  };

  if (options && options.progress) {
    await options.progress(0, checkpoint, initResult.res);
  }

  return this._resumeMultipart(checkpoint, options);
}

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
export async function _resumeMultipart(checkpoint, options) {
  const that = this;
  if (this.isCancel()) {
    throw this._makeCancelEvent();
  }
  const { file, fileSize, partSize, uploadId, doneParts, name } = checkpoint;

  const internalDoneParts = [];

  if (doneParts.length > 0) {
    copy(doneParts).to(internalDoneParts);
  }

  const partOffs = this._divideParts(fileSize, partSize);
  const numParts = partOffs.length;
  let multipartFinish = false;

  let uploadPartJob = function uploadPartJob(self, partNo) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        if (!self.isCancel()) {
          const pi = partOffs[partNo - 1];
          const data = file.slice(pi.start, pi.end);

          let result;
          try {
            result = await self._uploadPart(name, uploadId, partNo, data);
          } catch (error) {
            if (error.status === 404) {
              throw self._makeAbortEvent();
            }
            throw error;
          }
          if (!self.isCancel() && !multipartFinish) {
            checkpoint.doneParts.push({
              number: partNo,
              etag: result.res.headers.etag,
            });

            if (options.progress) {
              await options.progress(doneParts.length / numParts, checkpoint, result.res);
            }

            resolve({
              number: partNo,
              etag: result.res.headers.etag,
            });
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      } catch (err) {
        const tempErr = new Error();
        tempErr.name = err.name;
        tempErr.message = err.message;
        tempErr.stack = err.stack;
        tempErr.partNum = partNo;
        copy(err).to(tempErr);
        reject(tempErr);
      }
    });
  };

  const all = Array.from(new Array(numParts), (x, i) => i + 1);
  const done = internalDoneParts.map((p) => p.number);
  const todo = all.filter((p) => done.indexOf(p) < 0);
  const defaultParallel = 5;
  const parallel = options.parallel || defaultParallel;

  // upload in parallel
  const jobErr = await this._parallel(
    todo,
    parallel,
    (value) =>
      new Promise((resolve, reject) => {
        uploadPartJob(that, value)
          .then((result) => {
            if (result) {
              internalDoneParts.push(result);
            }
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      }),
  );
  multipartFinish = true;

  const abortEvent = jobErr.find((err) => err.name === 'abort');
  if (abortEvent) throw abortEvent;

  if (this.isCancel()) {
    uploadPartJob = null;
    throw this._makeCancelEvent();
  }

  if (jobErr && jobErr.length > 0) {
    jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${
      jobErr[0].partNum
    }`;
    throw jobErr[0];
  }

  return this.completeMultipartUpload(name, uploadId, internalDoneParts, options);
}

/**
 * Get file size
 */
export function _getFileSize(file) {
  if (is.arrayBuffer(file)) {
    return file.byteLength;
  }

  throw new Error('_getFileSize requires ArrayBuffer.');
}

export function _getPartSize(fileSize, partSize) {
  const maxNumParts = 10 * 1000;
  const defaultPartSize = 1 * 1024 * 1024;

  if (!partSize) partSize = defaultPartSize;
  const safeSize = Math.ceil(fileSize / maxNumParts);

  if (partSize < safeSize) {
    partSize = safeSize;
    console.warn(
      `partSize has been set to ${partSize}, because the partSize you provided causes partNumber to be greater than 10,000`,
    );
  }
  return partSize;
}

export function _divideParts(fileSize, partSize) {
  const numParts = Math.ceil(fileSize / partSize);

  const partOffs = [];
  for (let i = 0; i < numParts; i += 1) {
    const start = partSize * i;
    const end = Math.min(start + partSize, fileSize);

    partOffs.push({
      start,
      end,
    });
  }

  return partOffs;
}
