import createRequest from './createRequest';
import { setSTSToken } from './utils/setSTSToken';

/**
 * request oss server
 * @param {Object} params
 *   - {String} object
 *   - {String} bucket
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Buffer} [content]
 *   - {Stream} [stream]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [xmlResponse]
 *   - {Boolean} [customResponse]
 *   - {Number} [timeout]
 *   - {Object} [ctx] request context, default is `this.ctx`
 *
 * @api private
 */
export async function request(params) {
  const reqParams = createRequest.call(this, params);
  let result;
  let reqErr;
  // const useStream = !!params.stream;
  const useStream = false;
  try {
    result = await this.urllib.request(reqParams.url, reqParams.params);
    this.debug(
      'response %s %s, got %s, headers: %j',
      params.method,
      reqParams.url,
      result.status,
      result.headers,
      'info',
    );
  } catch (err) {
    reqErr = err;
  }

  let err;
  if (
    result &&
    params.successStatuses &&
    params.successStatuses.indexOf(result.res.status) === -1
  ) {
    err = await this.requestError(result);
    // not use stream
    if (err.code === 'RequestTimeTooSkewed' && !useStream) {
      this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date();
      return this.request(params);
    }
    err.params = params;
  } else if (reqErr) {
    err = await this.requestError(reqErr);
  }

  if (err) {
    if (
      err.status === 403 &&
      err.code === 'InvalidAccessKeyId' &&
      this.options.accessKeyId.startsWith('STS.') &&
      typeof this.options.refreshSTSToken === 'function'
    ) {
      // prevent infinite loop, only trigger once within 10 seconds
      if (!this._setOptions || Date.now() - this._setOptions > 10000) {
        this._setOptions = Date.now();
        await setSTSToken.call(this);
        return this.request(params);
      }
    }
    throw err;
  }

  if (params.xmlResponse) {
    const parseData = await this.parseXML(result.data);
    result.data = parseData;
  }
  return result;
}

/**
 * generater a request error with request response
 * @param {Object} result
 *
 * @api private
 */

export async function requestError(result) {
  let err = null;
  if (!result.data || !result.data.length) {
    if (result.status === -1 || result.status === -2) {
      // -1 is net error , -2 is timeout
      err = new Error(result.message);
      err.name = result.name;
      err.status = result.status;
      err.code = result.name;
    } else {
      // HEAD not exists resource
      if (result.status === 404) {
        err = new Error('Object not exists');
        err.name = 'NoSuchKeyError';
        err.status = 404;
        err.code = 'NoSuchKey';
      } else if (result.status === 412) {
        err = new Error('Pre condition failed');
        err.name = 'PreconditionFailedError';
        err.status = 412;
        err.code = 'PreconditionFailed';
      } else {
        err = new Error(`Unknow error, status: ${result.status}`);
        err.name = 'UnknowError';
        err.status = result.status;
      }
      err.requestId = result.headers['x-oss-request-id'];
      err.host = '';
    }
  } else {
    const message = String(result.data);
    this.debug('request response error data: %s', message, 'error');

    let info;
    try {
      info = (await this.parseXML(message)) || {};
    } catch (error) {
      this.debug(message, 'error');
      error.message += `\nraw xml: ${message}`;
      error.status = result.status;
      error.requestId = result.headers['x-oss-request-id'];
      return error;
    }

    let msg = info.Message || `unknow request error, status: ${result.status}`;
    if (info.Condition) {
      msg += ` (condition: ${info.Condition})`;
    }
    err = new Error(msg);
    err.name = info.Code ? `${info.Code}Error` : 'UnknowError';
    err.status = result.status;
    err.code = info.Code;
    err.requestId = info.RequestId;
    err.hostId = info.HostId;
    err.serverTime = info.ServerTime;
  }

  this.debug('generate error %j', err, 'error');
  return err;
}
