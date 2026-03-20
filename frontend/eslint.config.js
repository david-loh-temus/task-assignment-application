// @ts-check

import js from '@eslint/js';
import globals from 'globals';
import { tanstackConfig } from '@tanstack/eslint-config';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPerfPlugin from 'eslint-plugin-react-perf';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import vitestPlugin from 'eslint-plugin-vitest';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '.tanstack/**',
      '.output/**',
      '.vinxi/**',
      '**/routeTree.gen.ts',
      'eslint.config.js',
      'prettier.config.js',
      'public/**',
    ],
  },

  js.configs.recommended,
  ...tanstackConfig,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        React: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-perf': reactPerfPlugin,
      prettier: prettierPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
        }),
      ],
    },
    rules: {
      'no-console': 'error',
      'no-alert': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'error',
      'max-depth': ['error', 3],
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2, 3, 10, 24, 30, 60, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'prettier/prettier': 'error',
      semi: 'off',

      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-handler-names': [
        'error',
        {
          eventHandlerPrefix: 'handle',
          eventHandlerPropPrefix: 'on',
        },
      ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/prefer-stateless-function': 'error',
      'react-perf/jsx-no-new-function-as-prop': 'error',
      'react-perf/jsx-no-new-object-as-prop': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'import/no-cycle': 'off',
      'no-undef': 'off',
    },
  },

  {
    files: ['src/app/router.tsx'],
    rules: {
      'import-x/no-unresolved': 'off',
    },
  },

  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    plugins: {
      vitest: vitestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
      },
    },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          vars: 'all',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
];
