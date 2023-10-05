module.exports = {
  clearMocks: true,

  moduleFileExtensions: ['ts', 'js'],

  testPathIgnorePatterns: ['/.yalc/', '/data/', '/_helpers'],

  testEnvironment: 'node',

  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
};
