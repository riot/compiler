import {
  execute,
  postprocessors,
  register,
  unregister,
} from '../src/postprocessors.js'
import { expect } from 'chai'

describe('Postprocessors', () => {
  function postprocessor(source) {
    return {
      code: source.replace('foo', 'bar'),
    }
  }

  function postprocessor2(source) {
    return {
      code: source.replace('bar', 'baz'),
    }
  }

  describe('postprocessors.register', () => {
    it('postprocessors can be properly registered', () => {
      register(postprocessor)

      expect(postprocessors.size).to.be.equal(1)

      unregister(postprocessor)
    })

    it('the same postprocessor can no be registred twice', () => {
      register(postprocessor)

      expect(() => register(postprocessor)).to.throw()

      expect(postprocessors.size).to.be.equal(1)
      unregister(postprocessor)
    })
  })

  describe('postprocessors.unregister', () => {
    it('postprocessors can not be unregistered if it was never previously registered', () => {
      expect(() => unregister(postprocessor)).to.throw()
    })
  })

  describe('postprocessors.execute', () => {
    it('postprocessors can be properly executed', () => {
      register(postprocessor)

      const result = execute({ code: 'foo' })

      expect(result.code).to.be.equal('bar')

      unregister(postprocessor)
    })

    it('postprocessors can be properly executed in series', () => {
      register(postprocessor)
      register(postprocessor2)

      const result = execute({ code: 'foo' })

      expect(result.code).to.be.equal('baz')

      unregister(postprocessor)
      unregister(postprocessor2)
    })
  })
})
