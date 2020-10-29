import mime from 'mime';
import path from 'path-browserify';
import copy from 'copy-to';
import dateFormat from 'dateformat';
import crypto from 'crypto';
import { getReqUrl } from './getReqUrl';

function getHeader(headers, name) {
  return headers[name] || headers[name.toLowerCase()];
}

function delHeader(headers, name) {
  delete headers[name];
  delete headers[name.toLowerCase()];
}

export default function createRequest(params) {
  let date = new Date();
  if (this.options.amendTimeSkewed) {
    date = +new Date() + this.options.amendTimeSkewed;
  }
  const headers = {
    'x-oss-date': dateFormat(date, "UTC:ddd, dd mmm yyyy HH:MM:ss 'GMT'"),
    // 'x-oss-user-agent': this.userAgent
  };

  if (this.options.isRequestPay) {
    Object.assign(headers, { 'x-oss-request-payer': 'requester' });
  }

  if (this.options.stsToken) {
    headers['x-oss-security-token'] = this.options.stsToken;
  }

  copy(params.headers).to(headers);

  if (!getHeader(headers, 'Content-Type')) {
    if (params.mime && params.mime.indexOf('/') > 0) {
      headers['Content-Type'] = params.mime;
    } else {
      headers['Content-Type'] = mime.getType(params.mime || path.extname(params.name || ''));
    }
  }
  if (!getHeader(headers, 'Content-Type')) {
    delHeader(headers, 'Content-Type');
    headers['Content-Type'] = 'application/json';
  }

  if (params.content) {
    headers['Content-Md5'] = crypto.createHash('md5').update(params.content).digest('base64');
    if (!headers['Content-Length']) {
      headers['Content-Length'] = params.content.length;
    }
  }

  const authResource = this._getResource(params);
  headers.authorization = this.authorization(
    params.method,
    authResource,
    params.subres,
    headers,
    this.options.headerEncoding,
  );

  const url = getReqUrl.bind(this)(params);
  const timeout = params.timeout || this.options.timeout;
  const reqParams = {
    method: params.method,
    content: params.content,
    headers,
    timeout,
    ctx: params.ctx || this.ctx,
  };

  return {
    url,
    params: reqParams,
  };
}
