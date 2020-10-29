import urllib from 'urllib';
import X2JS from 'x2js';
import _initOptions from './initOptions';
import * as signature from './utils/signature';

export default function Client(options) {
  if (options && options.inited) {
    this.options = options;
  } else {
    this.options = Client.initOptions(options);
  }

  this.options.cancelFlag = false; // cancel flag: if true need to be cancelled, default false

  this.urllib = urllib;

  // record the time difference between client and server
  this.options.amendTimeSkewed = 0;
}

Client.initOptions = function initOptions(options) {
  if (!options.stsToken) {
    console.warn(
      'Please use STS Token for safety, see more details at https://help.aliyun.com/document_detail/32077.html',
    );
  }
  const opts = { secure: true, ...options };

  return _initOptions(opts);
};

const proto = Client.prototype;

proto.debug = () => {};

/**
 * get author header
 *
 * "Authorization: OSS " + Access Key Id + ":" + Signature
 *
 * Signature = base64(hmac-sha1(Access Key Secret + "\n"
 *  + VERB + "\n"
 *  + CONTENT-MD5 + "\n"
 *  + CONTENT-TYPE + "\n"
 *  + DATE + "\n"
 *  + CanonicalizedOSSHeaders
 *  + CanonicalizedResource))
 *
 * @param {String} method
 * @param {String} resource
 * @param {Object} header
 * @return {String}
 *
 * @api private
 */
proto.authorization = function authorization(method, resource, subres, headers) {
  const stringToSign = signature.buildCanonicalString(method.toUpperCase(), resource, {
    headers,
    parameters: subres,
  });

  return signature.authorization(
    this.options.accessKeyId,
    this.options.accessKeySecret,
    stringToSign,
    this.options.headerEncoding,
  );
};

/**
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXML = function parseXML(str) {
  return new Promise((resolve, reject) => {
    try {
      const json = new X2JS({ ignoreRoot: true }).xml2js(str);
      resolve(json);
    } catch (err) {
      reject(err);
    }
  });
};

proto._getResource = function getResource(params) {
  let resource = '/';
  if (params.bucket) {
    resource += `${params.bucket}/`;
  }
  if (params.object) {
    resource += params.object;
  }

  return resource;
};

proto._escape = function _escape(name) {
  return encodeURIComponent(name).replace(/%2F/g, '/');
};

Object.assign(proto, require('./request'));
Object.assign(proto, require('./object'));
Object.assign(proto, require('./parallel'));
Object.assign(proto, require('./multipart'));
Object.assign(proto, require('./managed-upload'));
