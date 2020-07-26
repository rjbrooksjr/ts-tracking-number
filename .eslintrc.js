module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 0,
    camelcase: ['error', { properties: 'never' }],
    'comma-style': ['error', 'last'],
    'eol-last': ['error', 'always'],
    'max-len': ['error', { code: 120, tabWidth: 2 }],
    'no-explicit-any': 0,
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
