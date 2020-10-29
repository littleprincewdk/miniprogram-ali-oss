module.exports = {
  rules: {
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          dateFormat: './shims/dateFormat',
          'is-type-of': './shims/is-type-of',
          'merge-descriptors': './shims/merge-descriptors',
          mime: './shims/mime',
          urllib: './shims/urllib',
          x2js: './shims/x2js',
          xml2json: './shims/xml2json',
        },
        extensions: ['.js', '.ts'],
      },
    },
  },
};
