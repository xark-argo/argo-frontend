const {resolve} = require("path")

module.exports = {
  root: true,
  env: { browser: true, es6: true, node: true },
  extends: [
    'eslint:recommended',
    "airbnb",
    "airbnb-typescript",
    "prettier",
    'plugin:import/recommended',
    "plugin:prettier/recommended",
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      legacyDecorators: true
    },
    ecmaVersion: 2020,
    sourceType: "module",
    useJSXTextNode: true,
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh', 'react-hooks', '@typescript-eslint', 'simple-import-sort'],
  settings: {
    "import/resolver": {
      alias: {
        map: [['~', resolve(__dirname, './src')]],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
      },
    }
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/naming-convention': 'off',
    'import/no-cycle': 'off',
    'simple-import-sort/imports': ['error', {
      groups: [
        // Packages.
        // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
        ["^@?\\w"],
        // Absolute imports and other imports such as Vue-style `@/foo`.
        // Anything not matched in another group.
        ["^"],
        // Relative imports.
        // Anything that starts with a dot.
        ["^\\."],
         // Side effect imports.
         ["^\\u0000"],
      ]
    }],
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'prettier/prettier': [
      'error',
      {
        printWidth: 80,
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: false,
        jsxBracketSameLine: false,
        requirePragma: false,
      },
    ],
    'camelcase': 'off',
    'no-undef': 'off',
    'no-case-declarations': 'off',
    'react/jsx-filename-extension': [
      1,
      {
        'extensions': [
          '.js',
          '.jsx',
          '.ts',
          '.tsx'
        ]
      }
    ],
    "react/button-has-type": "off",
    "react/state-in-constructor": "off",
    "react/no-array-index-key": "warn",
    "react/jsx-one-expression-per-line": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react/require-default-props": "off",
    'react/prop-types': 'off',
    'jsx-a11y/href-no-hash': 'off',
    'jsx-a11y/media-has-caption': 'off',
    'jsx-a11y/alt-text': 'off',
    'jsx-a11y/accessible-emoji': 'off',
    'jsx-a11y/anchor-is-valid': [
      'warn',
      {
        aspects: ['invalidHref'],
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        'd.ts': 'never',
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    'react/jsx-props-no-spreading': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'react/static-property-placement': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
  },
}
