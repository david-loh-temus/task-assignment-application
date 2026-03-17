const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const noSecretsPlugin = require('eslint-plugin-no-secrets');
const sonarjsPlugin = require('eslint-plugin-sonarjs');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules', 'build', 'dist', '**/*.spec.ts', '**/*.test.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: false,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'import': importPlugin,
      'no-secrets': noSecretsPlugin,
      'sonarjs': sonarjsPlugin,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // TypeScript ESLint Rules
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', argsIgnorePattern: '^_' },
      ],

      // ESLint Core Rules
      'eqeqeq': 'error',
      'no-console': 'error',
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2, 24, 30, 60, 100, 1000],
          ignoreArrayIndexes: true,
        },
      ],
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'no-var': 'error',
      'prefer-const': 'error',

      // Import Rules
      'import/no-extraneous-dependencies': 'error',
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always-and-inside-groups',
          alphabetize: {
            order: 'asc',
          },
        },
      ],

      // Security Rules
      'no-secrets/no-secrets': 'error',

      // SonarJS Rules
      'sonarjs/cognitive-complexity': 'error',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-magic-numbers': 'off',
      'no-console': 'off',
    },
  },
  prettierConfig,
];
