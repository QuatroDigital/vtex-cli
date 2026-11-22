// Tests never touch a real login: the CLI folder (session, logs) goes to a temp folder.
process.env.VTEX_HOME = require('path').join(require('os').tmpdir(), 'vtex-cli-jest')

module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(.*(test|spec)).tsx?$',
  testEnvironment: 'node',
}
