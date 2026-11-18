const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Layer boundaries from ARCHITECTURE.md §2. Dependencies point inward:
// app -> components -> hooks -> db -> lib. A violation fails `npm run check`.
const restrict = (groups, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: groups, message }] }],
});

const REACT_AND_EXPO = ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', 'react/*'];
const ALIAS = (dir) => [`@/${dir}`, `@/${dir}/*`, `**/${dir}`, `**/${dir}/*`];
const DB_BLOCKED = [
  'react',
  'react-native',
  'react-native-*',
  'react/*',
  ...ALIAS('hooks'),
  ...ALIAS('components'),
  ...ALIAS('theme'),
  '@/app/*',
];

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'node_modules/*', 'coverage/*']),
  expoConfig,

  // Applies everywhere: workout dates are 'YYYY-MM-DD' strings and must never go
  // through the Date string parser (timezone bugs). Only dates.ts is exempt.
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "NewExpression[callee.name='Date'][arguments.length>0]:not([arguments.0.type='Literal'][arguments.0.raw=/^\\d/])",
          message:
            'Do not construct a Date from a string/value outside src/lib/dates.ts. Use the helpers in src/lib/dates.ts (Date.UTC arithmetic on YYYY-MM-DD strings).',
        },
      ],
    },
  },

  // src/lib: pure. Nothing but the TypeScript std lib.
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: restrict(
      [
        ...REACT_AND_EXPO,
        ...ALIAS('db'),
        ...ALIAS('hooks'),
        ...ALIAS('components'),
        ...ALIAS('theme'),
        '@/app/*',
      ],
      'src/lib is pure: it may not import React, Expo, db, hooks, components, theme or app.',
    ),
  },
  // src/db: lib only. expo-sqlite is allowed only in client.ts (see override below).
  {
    files: ['src/db/**/*.{ts,tsx}'],
    rules: restrict(
      [...DB_BLOCKED, 'expo-sqlite'],
      'src/db may import only src/lib; expo-sqlite is allowed only in src/db/client.ts.',
    ),
  },
  {
    files: ['src/db/client.ts'],
    rules: restrict(DB_BLOCKED, 'src/db may import only src/lib and expo-sqlite.'),
  },
  // src/platform: thin wrappers over native modules (files, sharing). lib only.
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: restrict(
      [
        'react',
        'react-native',
        'react-native-*',
        'react/*',
        ...ALIAS('db'),
        ...ALIAS('hooks'),
        ...ALIAS('components'),
        ...ALIAS('theme'),
        '@/app/*',
        'expo-sqlite',
      ],
      'src/platform may import only src/lib and native modules.',
    ),
  },
  // src/hooks: lib + db. No UI layers.
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: restrict(
      [...ALIAS('components'), '@/app/*', 'expo-sqlite'],
      'src/hooks may import lib and db only (and never expo-sqlite directly).',
    ),
  },
  // src/components: no direct db or SQL access.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: restrict(
      [...ALIAS('db'), '@/app/*', 'expo-sqlite'],
      'Components must not touch db/SQL; go through hooks.',
    ),
  },
  // app/ (screens): no SQL either.
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: restrict(
      [...ALIAS('db'), 'expo-sqlite'],
      'Screens must not import db/expo-sqlite; use hooks (and the root provider).',
    ),
  },

  // dates.ts is the one place allowed to build a Date (from numeric UTC parts).
  {
    files: ['src/lib/dates.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  // Config files run in Node.
  {
    files: ['*.config.js', 'babel.config.js'],
    languageOptions: {
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' },
    },
  },
]);
