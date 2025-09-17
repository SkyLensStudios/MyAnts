module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // TypeScript specific rules (basic setup)
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // General JavaScript rules
    'no-console': 'off', // Allow console logs for now
    'no-debugger': 'warn',
    'prefer-const': 'error',

    // React specific rules (disabled for now)
    // 'react/jsx-uses-react': 'error',
    // 'react/jsx-uses-vars': 'error',
    // 'react/prop-types': 'off',
    // 'react-hooks/rules-of-hooks': 'error',
    // 'react-hooks/exhaustive-deps': 'warn',

    // Code style
    'indent': 'off', // Let Prettier handle this
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Electron main process files
      files: ['src/main/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        'no-console': 'off', // Main process can use console
      },
    },
    {
      // Renderer process files
      files: ['src/renderer/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: false,
      },
      // extends: [
      //   'plugin:react/recommended',
      //   'plugin:react-hooks/recommended',
      // ],
    },
    {
      // Engine files
      files: ['engine/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        'no-console': 'off', // Engine can use console for debugging
      },
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off', // Tests can use console
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'build/',
    '*.js', // Ignore compiled JS files
    'webpack.config.js',
  ],
};