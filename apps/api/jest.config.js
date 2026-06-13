const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: path.join(__dirname, '../../test/api'),
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: path.join(__dirname, '../../test/api/tsconfig.json'),
      },
    ],
  },
  collectCoverageFrom: [
    path.join(__dirname, 'src/**/*.(t|j)s'),
    '!**/*.spec.ts',
  ],
  coverageDirectory: path.join(__dirname, '../../coverage/api'),
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@sar/shared$': path.join(__dirname, '../../packages/shared/src/index.ts'),
    '^@api/(.*)$': path.join(__dirname, 'src/$1'),
  },
};
