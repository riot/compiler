import {compile} from '../src'
import {expect} from 'chai'
import {getFixture} from './helpers'

describe('Core specs', () => {
  describe('Simple tags', () => {
    it('The compiler generates a sourcemap and an output', async function() {
      const result = await compile(getFixture('my-component'))

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
    })
  })
})