const is = require('is-type-of');
const CryptoJS = require('./crypto-js/index');

function error() {
  var m = [].slice.call(arguments).join(' ');
  throw new Error([m, 'we accept pull requests'].join('\n'));
}

// https://github.com/brix/crypto-js/issues/91#issuecomment-447203383
// https://stackoverflow.com/questions/33914764/how-to-read-a-binary-file-with-filereader-in-order-to-hash-it-with-sha-256-in-cr/33918579#33918579
function arrayBufferToWordArray(ab) {
  var i8a = new Uint8Array(ab);
  var a = [];
  for (var i = 0; i < i8a.length; i += 4) {
    a.push((i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]);
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
}

const algorithms = {
  md5: CryptoJS.algo.MD5,
  sha1: CryptoJS.algo.SHA1,
};

const encoders = {
  base64: CryptoJS.enc.Base64,
  hex: CryptoJS.enc.Hex,
  latin1: CryptoJS.enc.Latin1,
  utf8: CryptoJS.enc.Utf8,
};

function hash(hasher) {
  return {
    update(data) {
      if (is.arrayBuffer(data)) {
        data = arrayBufferToWordArray(data);
      }
      hasher.update(data);
      return this;
    },
    digest(enc) {
      const encorder = encoders[enc];
      if (!encorder) {
        error('sorry, encoding:', enc, 'is not implemented yet');
      }
      return hasher.finalize().toString(encorder);
    },
  };
}

module.exports = {
  createHash(algo) {
    const hasher = algorithms[algo].create();
    return hash(hasher);
  },
  createHmac(algo, key) {
    const hasher = algorithms[algo].create();
    const hmac = CryptoJS.algo.HMAC.create(hasher, key);
    return hash(hmac);
  },
};

[
  'createCredentials',
  'createCipher',
  'createCipheriv',
  'createDecipher',
  'createDecipheriv',
  'createSign',
  'createVerify',
  'createDiffieHellman',
  'pbkdf2',
].forEach((method) => {
  module.exports[method] = function () {
    error('sorry,', method, 'is not implemented yet');
  };
});
