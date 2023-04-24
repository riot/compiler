import { createOutput, transform } from '../src/transformer.js'
import { expect } from 'chai'

describe('Transformer', () => {
  describe('transformer.transform', () => {
    it('can convert properly the input received using a custom compiler', () => {
      const result = transform(
        (source, options) => {
          return {
            code: `Hello ${source}, ${options.name}`,
            map: {},
          }
        },
        {
          name: 'Developer',
        },
        'World',
      )

      expect(result.code).to.be.equal('Hello World, Developer')
      expect(result.map).to.be.an('object')
    })

    it('leave the input as it is without a compiler', () => {
      const result = transform(null, null, 'foo')

      expect(result.code).to.be.equal('foo')
    })
  })

  describe('transformer.createOutput', () => {
    it('create an output object without a sourcemap', () => {
      const result = createOutput({ code: 'foo' })

      expect(result.code).to.be.equal('foo')
      expect(result.map).to.be.equal(null)
    })

    it('create an output object with a sourcemap if the file option was provided', () => {
      const result = createOutput(
        { code: 'foo' },
        { options: { file: 'foo.js' } },
      )

      expect(result.code).to.be.equal('foo')
      expect(result.map).to.be.not.equal(null)
    })
  })
})
