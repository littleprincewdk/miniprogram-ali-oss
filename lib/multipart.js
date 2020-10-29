import path from 'path-browserify';
import copy from 'copy-to';
import mime from 'mime';
import is from 'is-type-of';
import fs from 'fs';
import { deepCopy } from './utils/deepCopy';

/**
 * Abort a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Object} options
 */
export async function abortMultipartUpload(name, uploadId, options = {}) {
  this._stop();

  const opt = {};
  copy(options).to(opt);
  opt.subres = { uploadId };
  const params = this._objectRequestParams('DELETE', name, opt);
  params.successStatuses = [204];

  const result = await this.request(params);
  return {
    res: result.res,
  };
}

/**
 * Initiate a multipart upload transaction
 * @param {String} name the object name
 * @param {Object} options
 * @return {String} upload id
 */
export async function initMultipartUpload(name, options = {}) {
  const opt = {};
  copy(options).to(opt);
  opt.headers = opt.headers || {};
  this._convertMetaToHeaders(options.meta, opt.headers);

  opt.subres = 'uploads';
  const params = this._objectRequestParams('POST', name, opt);
  params.mime = options.mime;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res,
    bucket: result.data.Bucket,
    name: result.data.Key,
    uploadId: result.data.UploadId,
  };
}

/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {File} file upload File, whole File
 * @param {Integer} start  part start bytes  e.g: 102400
 * @param {Integer} end  part end bytes  e.g: 204800
 * @param {Object} options
 */
export async function uploadPart(name, uploadId, partNo, file, start, end, options = {}) {
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

  const data = file.slice(start, end);

  return this._uploadPart(name, uploadId, partNo, data, options);
}

/**
 * Complete a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Array} parts the uploaded parts, each in the structure:
 *        {Integer} number partNo
 *        {String} etag  part etag  uploadPartCopy result.res.header.etag
 * @param {Object} options
 *         {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *         {String} options.callback.url  the OSS sends a callback request to this URL
 *         {String} options.callback.host  The host header value for initiating callback requests
 *         {String} options.callback.body  The value of the request body when a callback is initiated
 *         {String} options.callback.contentType  The Content-Type of the callback requests initiatiated
 *         {Object} options.callback.customValue  Custom parameters are a map of key-values, e.g:
 *                   customValue = {
 *                     key1: 'value1',
 *                     key2: 'value2'
 *                   }
 */
export async function completeMultipartUpload(name, uploadId, parts, options = {}) {
  const completeParts = parts
    .concat()
    .sort((a, b) => a.number - b.number)
    .filter((item, index, arr) => !index || item.number !== arr[index - 1].number);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CompleteMultipartUpload>\n';
  for (let i = 0; i < completeParts.length; i += 1) {
    const p = completeParts[i];
    xml += '<Part>\n';
    xml += `<PartNumber>${p.number}</PartNumber>\n`;
    xml += `<ETag>${p.etag}</ETag>\n`;
    xml += '</Part>\n';
  }
  xml += '</CompleteMultipartUpload>';

  let opt = {};
  opt = deepCopy(options);
  if (opt.headers) {
    delete opt.headers['x-oss-server-side-encryption'];
  }
  opt.subres = { uploadId };

  const params = this._objectRequestParams('POST', name, opt);
  // callback.encodeCallback(params, opt);
  params.mime = 'xml';
  params.content = xml;

  if (!(params.headers && params.headers['x-oss-callback'])) {
    params.xmlResponse = true;
  }
  params.successStatuses = [200];
  const result = await this.request(params);

  const ret = {
    res: result.res,
    bucket: params.bucket,
    name,
    etag: result.res.headers.etag,
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
}

/**
 * Upload a part in a multipart upload transaction
 * @param {String} name the object name
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Object} data the body data
 * @param {Object} options
 */
export async function _uploadPart(name, uploadId, partNo, data, options = {}) {
  const opt = {};
  copy(options).to(opt);
  opt.headers = {
    'Content-Length': data.byteLength,
  };

  opt.subres = {
    partNumber: partNo,
    uploadId,
  };
  const params = this._objectRequestParams('PUT', name, opt);
  params.mime = opt.mime;
  params.content = data;
  params.successStatuses = [200];

  const result = await this.request(params);

  if (!result.res.headers.etag) {
    throw new Error(
      'Please set the etag of expose-headers in OSS \n https://help.aliyun.com/document_detail/32069.html',
    );
  }

  return {
    name,
    etag: result.res.headers.etag,
    res: result.res,
  };
}
