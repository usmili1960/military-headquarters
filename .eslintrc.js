/**
 * ESLint Configuration
 * Code quality and style standards for the project
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-destructuring': 'warn',
    'no-param-reassign': ['error', { props: false }],
    'func-names': 'off',
    'object-shorthand': 'warn',
    'class-methods-use-this': 'off',
    'no-alert': 'off',
    'no-plusplus': 'off',
    'arrow-body-style': 'off'
  }
};
