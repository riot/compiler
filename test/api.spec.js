import { registerPostprocessor, registerPreprocessor } from '../src/index.js'
import { expect } from 'chai'

describe('API specs', () => {
  describe('compiler.registerPreprocessor', () => {
    it('The method registerPreprocessor is a function', () => {
      expect(registerPreprocessor).to.be.a('function')
    })
  })

  describe('compiler.registerPostprocessor', () => {
    it('The method registerPostprocessor is a function', () => {
      expect(registerPostprocessor).to.be.a('function')
    })
  })
})
