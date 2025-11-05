module.exports = {
  root: true,
  env: { node: true, jest: true, es2022: true },
  extends: ['eslint:recommended', 'standard'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // allow logs during development
  },
};
