import crypto from 'crypto';
import is from 'is-type-of';

/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
export function buildCanonicalizedResource(resourcePath, parameters) {
  let canonicalizedResource = `${resourcePath}`;
  let separatorString = '?';

  if (is.string(parameters) && parameters.trim() !== '') {
    canonicalizedResource += separatorString + parameters;
  } else if (is.array(parameters)) {
    parameters.sort();
    canonicalizedResource += separatorString + parameters.join('&');
  } else if (parameters) {
    const compareFunc = (entry1, entry2) => {
      if (entry1[0] > entry2[0]) {
        return 1;
      }
      if (entry1[0] < entry2[0]) {
        return -1;
      }
      return 0;
    };
    const processFunc = (key) => {
      canonicalizedResource += separatorString + key;
      if (parameters[key]) {
        canonicalizedResource += `=${parameters[key]}`;
      }
      separatorString = '&';
    };
    Object.keys(parameters).sort(compareFunc).forEach(processFunc);
  }

  return canonicalizedResource;
}

/**
 * @param {String} method
 * @param {String} resourcePath
 * @param {Object} request
 * @param {String} expires
 * @return {String} canonicalString
 */
export function buildCanonicalString(method, resourcePath, request, expires) {
  request = request || {};
  const headers = request.headers || {};
  const OSS_PREFIX = 'x-oss-';
  const ossHeaders = [];
  const headersToSign = {};

  let signContent = [
    method.toUpperCase(),
    headers['Content-Md5'] || '',
    headers['Content-Type'] || headers['Content-Type'.toLowerCase()],
    expires || headers['x-oss-date'],
  ];

  Object.keys(headers).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  });

  Object.keys(headersToSign)
    .sort()
    .forEach((key) => {
      ossHeaders.push(`${key}:${headersToSign[key]}`);
    });

  signContent = signContent.concat(ossHeaders);

  signContent.push(buildCanonicalizedResource(resourcePath, request.parameters));

  return signContent.join('\n');
}

/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export function computeSignature(accessKeySecret, canonicalString) {
  const signature = crypto.createHmac('sha1', accessKeySecret);
  return signature.update(canonicalString).digest('base64');
}

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export function authorization(accessKeyId, accessKeySecret, canonicalString, headerEncoding) {
  return `OSS ${accessKeyId}:${computeSignature(accessKeySecret, canonicalString, headerEncoding)}`;
}
