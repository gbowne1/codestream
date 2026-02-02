module.exports = {
  // Stops ESLint from looking for config files in parent directories (good for monorepos)
  root: true,

  // Defines the environments where the code runs (enables globals like 'window' and 'process')
  env: {
    browser: true,
    node: true,
    es2023: true,
  },

  // Use Babel parser to support the latest ES7+ syntax and experimental features
  // (Requires @babel/eslint-parser and @babel/core to be installed)
  parser: '@babel/eslint-parser',

  parserOptions: {
    requireConfigFile: false, // Allows using Babel parser without a separate babel config file
    ecmaVersion: 2023, // Explicitly supports modern ECMAScript syntax
    sourceType: 'module', // Allows use of ES modules (import/export)
    ecmaFeatures: {
      jsx: true, // Enables parsing of React JSX
    },
  },

  // "prettier/recommended" is crucial:
  // It enables eslint-plugin-prettier and eslint-config-prettier.
  // This runs Prettier as an ESLint rule and turns off ESLint formatting rules that conflict with Prettier.
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],

  plugins: ['import'],

  rules: {
    // Smart console rule: allows logging during dev, but warns in production builds
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // Best practices for modern JS
    'no-var': 'error', // Enforces 'let' or 'const' over 'var'
    'prefer-const': 'error', // Enforces 'const' if variable is never reassigned

    // Specific style enforcement as requested in Issue #80
    // (Note: Prettier handles most of this, but these rules enforce the specific preferences requested)
    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],

    // Prevents linting errors if project dependencies (like mongoose/express) aren't installed locally
    'import/no-unresolved': 'off',
  },

  // Files/Folders to ignore during linting
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'public/service-worker.js',
    'public/manifest.json',
    '*.min.js',
  ],

  overrides: [
    {
      files: ['*.cjs', '*.mjs', '*.js', '*.jsx'],
      parserOptions: { sourceType: 'module' },
    },
  ],
};
