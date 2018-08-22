import {getExpected, getFixture} from './helpers'
import {compile} from '../src'
import {expect} from 'chai'

describe('Riot compiler - Core specs', () => {
  describe('Simple tags', () => {
    it('It can compile a simple template properly', () => {
      return compile(getFixture('my-component')).then(res => {
        expect(res.code).to.be.equal(getExpected('my-component'))
      })
    })
  })
})