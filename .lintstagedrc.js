module.exports = {
  // https://github.com/okonet/lint-staged/issues/661
  // https://github.com/eslint/eslint/issues/2309#issuecomment-219828044
  // `--max-warnings 0` 使 waring也抛出错误
  '*.{js,ts}': ['eslint --fix --report-unused-disable-directives --max-warnings 0', 'git add'],
};
