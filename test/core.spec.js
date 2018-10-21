import {evaluateScript, getFixture} from './helpers'
import {compile} from '../src'
import {expect} from 'chai'

describe('Core specs', () => {
  describe('Simple tags', () => {
    it('The compiler generates a sourcemap and an output', async function() {
      const result = await compile(getFixture('my-component'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default).to.have.all.keys('tag', 'css', 'template')
    })
  })
})