const { compile } = require('../dist')
const { expect } = require('chai')
const sh = require('shelljs')
const FIXTURES_DIR = './test/fixtures/'
const EXPECTED_DIR = './test/expected/'

function getFixture(name) {
  return String(sh.cat(`${FIXTURES_DIR}${name}.tag`))
}

function getExpected(name) {
  return String(sh.cat(`${EXPECTED_DIR}${name}.js`))
}

describe('Riot compiler', () => {
  describe('Simple tags', () => {
    it('It can compile a simple template properly', () => {
      const tagName = 'simple-template'
      console.log(compile(tagName, getFixture(tagName)))
      return compile(tagName, getFixture(tagName)).then(res => {
        expect(res.code).to.be.equal(getExpected(tagName))
      })
    })
  })
})