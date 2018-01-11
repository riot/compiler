const sh = require('shelljs')
const FIXTURES_DIR = './test/fixtures/'
const EXPECTED_DIR = './test/expected/'

module.exports = {
  getFixture(name) {
    return String(sh.cat(`${FIXTURES_DIR}${name}.tag`))
  },
  getExpected(name) {
    return String(sh.cat(`${EXPECTED_DIR}${name}.js`))
  }
}