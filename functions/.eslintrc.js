module.exports = {
    env: {
      es6: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
    ],
    rules: {
      'no-unused-vars': 'warn',  // or 'error'
      'no-undef': 'off',  // Turn off 'no-undef' errors for Firebase functions
    },
    parserOptions: {
      ecmaVersion: 2018, // Support modern JavaScript features
    },
  };
  