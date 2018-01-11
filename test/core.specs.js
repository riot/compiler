const { compile } = require('../dist')
const { expect } = require('chai')
const { getFixture, getExpected } = require('./helpers')

describe('Riot compiler - Core specs', () => {
  describe('Simple tags', () => {
    it('It can compile a simple template properly', () => {
      return compile(getFixture('my-component')).then(res => {
        expect(res.code).to.be.equal(getExpected('my-component'))
      })
    })
  })
})