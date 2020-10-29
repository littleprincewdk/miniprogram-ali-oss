exports.string = function isString(obj) {
  return typeof obj === 'string';
};

exports.array = Array.isArray;

exports.arrayBuffer = function isArrayBuffer(obj) {
  return Object.prototype.toString.call(obj) === '[object ArrayBuffer]';
};
