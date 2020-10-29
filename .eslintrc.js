module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  globals: {
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getCurrentPages: 'readonly',
    getApp: 'readonly',
  },
  rules: {
    'prettier/prettier': 'error',

    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',

    'import/extensions': 'off',
  },
  overrides: [
    {
      files: ['./**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
