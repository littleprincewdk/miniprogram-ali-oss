module.exports = {
  rules: {
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          'is-type-of': './shims/is-type-of',
          mime: './shims/mime',
          urllib: './shims/urllib',
        },
        extensions: ['.js', '.ts'],
      },
    },
  },
};
