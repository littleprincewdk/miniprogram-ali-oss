module.exports = {
  settings: {
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          'miniprogram-ali-oss': './example/miniprogram_npm/miniprogram-ali-oss',
        },
        extensions: ['.js', '.ts'],
      },
    },
  },
};
