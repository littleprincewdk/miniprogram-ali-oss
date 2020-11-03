const path = require('path');
const pkg = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './lib/index.js',
  output: {
    path:
      process.env.NODE_ENV === 'production'
        ? path.resolve('dist')
        : path.resolve('example/miniprogram_npm'),
    filename: process.env.NODE_ENV === 'production' ? 'index.js' : 'miniprogram-ali-oss.js',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      crypto: path.resolve('shims/crypto'),
      mime: path.resolve('shims/mime'),
      fs: path.resolve('shims/fs'),
      'is-type-of': path.resolve('shims/is-type-of'),
      urllib: path.resolve('shims/urllib'),
    },
  },
  externals:
    process.env.NODE_ENV === 'production'
      ? Object.keys(pkg.dependencies).reduce((previous, current) => {
          previous[current] = {
            commonjs: current,
            commonjs2: current,
          };
          return previous;
        }, {})
      : {},
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  },
  amd: false, // https://github.com/webpack/webpack/issues/11906
};
