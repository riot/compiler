import {execute, preprocessors, register, unregister} from '../src/preprocessors'
import {expect} from 'chai'

describe('Preprocessors', () => {
  function preprocessor(source) {
    return {
      code: source.replace('foo', 'bar')
    }
  }

  describe('preprocessors.register', () => {
    it('preprocessors without type can not be registered', () => {
      expect(() => register(null)).to.throw()
    })

    it('preprocessors without name can not be registered', () => {
      expect(() => register('template', null, preprocessor)).to.throw()
    })

    it('preprocessors without a function callback can not be registered', () => {
      expect(() => register('template', 'bar', false)).to.throw()
    })

    it('preprocessors of wrong type can not be registered', () => {
      expect(() => register('foo', 'bar', preprocessor)).to.throw()
    })

    it('it can not register twice the same preprocessor', () => {
      register('css', 'foo', preprocessor)

      expect(() => register('css', 'foo', preprocessor)).to.throw()

      unregister('css', 'foo')
    })

    it('it can register and unregister a preprocessor', () => {
      register('css', 'foo', preprocessor)

      expect(preprocessors.css.size).to.be.equal(1)

      unregister('css', 'foo')

      expect(preprocessors.css.size).to.be.equal(0)
    })
  })

  describe('preprocessors.unregister', () => {
    it('preprocessors without type can not be unregistered', () => {
      expect(() => unregister(null)).to.throw()
    })

    it('preprocessors without name can not be unregistered', () => {
      expect(() => unregister('template', null)).to.throw()
    })

    it('preprocessors never registered can not be unregistered', () => {
      expect(() => unregister('template', 'bar')).to.throw()
    })

    it('preprocessors of wrong type can not be unregistered', () => {
      expect(() => unregister('foo', 'bar')).to.throw()
    })


    it('it can unregister a preprocessor', () => {
      register('javascript', 'foo', preprocessor)

      expect(preprocessors.javascript.size).to.be.equal(1)

      unregister('javascript', 'foo')

      expect(preprocessors.javascript.size).to.be.equal(0)
    })
  })

  describe('preprocessors.execute', () => {
    it('preprocessors without type can not be executed', (done) => {
      execute(null).catch(() => done())
    })

    it('preprocessors without name can not be executed', (done) => {
      execute('template', null).catch(() => done())
    })

    it('preprocessors never registered can not be executed', (done) => {
      execute('template', 'bar').catch(() => done())
    })

    it('registered preprocessors can be executed', async function() {
      register('javascript', 'foo', preprocessor)
      const result = await execute('javascript', 'foo', null, 'foo')

      expect(result.code).to.be.equal('bar')

      unregister('javascript', 'foo')
    })
  })
})