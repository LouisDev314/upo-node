import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {
      semi: ['error', 'always'],
      'no-unused-vars': 'error',
      'no-unused-expressions': 'error',
      quotes: ['error', 'single'],
      'no-multi-spaces': 'error',
      eqeqeq: 'error',
      complexity: ['error', 10],
      'prettier/prettier': ['off', { endOfLine: 'auto' }],
      'linebreak-style': ['error', 'unix'],
      'object-curly-spacing': ['error', 'always'],
      'eol-last': ['error', 'always'],
      'comma-dangle': [2, 'always-multiline'],
      'no-duplicate-imports': ['error', { includeExports: true }],
      '@typescript-eslint/no-explicit-any': ['error'],
      'nonblock-statement-body-position': ['error', 'beside'],
    },
  },
];
