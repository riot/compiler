import {join,relative} from 'path'
import sh from 'shelljs'

const FIXTURES_DIR = './test/fixtures/'
const EXPECTED_DIR = './test/expected/'
const uid = (() => {
  let i = 0 // eslint-disable-line
  return () => i++
})()

export function getFixture(name) {
  return String(sh.cat(`${FIXTURES_DIR}${name}.tag`))
}

export function getExpected(name) {
  return String(sh.cat(`${EXPECTED_DIR}${name}.js`))
}

export function evaluateScript(code) {
  const TMP_FILE_NAME = `${uid()}-tmp-file.js`
  const filePath = join(EXPECTED_DIR, TMP_FILE_NAME)
  sh.ShellString(code).to(filePath)

  try {
    const content = require(`./${relative(__dirname, filePath)}`)
    return content
  } catch (error) {
    console.error(error) // eslint-disable-line
    return {}
  } finally {
    sh.rm(filePath)
  }
}