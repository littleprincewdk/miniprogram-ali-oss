import copy from 'copy-to';

/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

export function _objectRequestParams(method, name, options) {
  if (!this.options.bucket) {
    throw new Error('Please create a bucket first');
  }

  options = options || {};
  name = this._objectName(name);
  const params = {
    object: name,
    bucket: this.options.bucket,
    method,
    subres: options && options.subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };

  if (options.headers) {
    params.headers = {};
    copy(options.headers).to(params.headers);
  }
  return params;
}

export function _objectName(name) {
  return `${name}`.replace(/^\/+/, '');
}

export function _convertMetaToHeaders(meta, headers) {
  if (!meta) {
    return;
  }

  Object.keys(meta).forEach((k) => {
    headers[`x-oss-meta-${k}`] = meta[k];
  });
}
