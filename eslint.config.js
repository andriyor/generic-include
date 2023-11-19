const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  rules: {
    curly: ['error', 'all'],
  },
  overrides: {
    typescript: {
      'no-console': 'off',
    },
  },
})
