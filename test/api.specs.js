import {expect} from 'chai'
import {getFixture} from './helpers'
import {normalise} from '../dist'

describe('Riot compiler - API specs', () => {
  describe('compiler.normalise', () => {
    it('Leave the code untouched if no extra preparser are defined', () => {
      return normalise(getFixture('my-component')).then(res => {
        expect(res.code).to.be.equal(getFixture('my-component'))
      })
    })
  })
})