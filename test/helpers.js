import sh from 'shelljs'

const FIXTURES_DIR = './test/fixtures/'
const EXPECTED_DIR = './test/expected/'

export function getFixture(name) {
  return String(sh.cat(`${FIXTURES_DIR}${name}.tag`))
}

export function getExpected(name) {
  return String(sh.cat(`${EXPECTED_DIR}${name}.js`))
}