import compose from '../../src/utils/compose'
import {expect} from 'chai'
import {expressionToScopedFunction} from '../../src/generators/template/template-utils'
import {renderExpression} from '../helpers'

const renderExpr = compose(
  renderExpression,
  expressionToScopedFunction,
  expr => ({ text: expr })
)

describe('Generators - Template', () => {
  describe('Utils', () => {
    describe('Expressions rendering', () => {
      it('simple', () => {
        expect(renderExpr('foo')).to.be.equal('scope.foo')
      })

      it('throw in case of missing expression', () => {
        expect(() => renderExpr('')).to.throw
      })

      it('primitves', () => {
        expect(renderExpr('true')).to.be.equal('true')
        expect(renderExpr('null')).to.be.equal('null')
        expect(renderExpr('\'hello\'')).to.be.equal('\'hello\'')
        expect(renderExpr('undefined')).to.be.equal('undefined')
        expect(renderExpr('RegExp')).to.be.equal('RegExp')
        expect(renderExpr('Number')).to.be.equal('Number')
        expect(renderExpr('Boolean')).to.be.equal('Boolean')
      })

      it('simple sum', () => {
        expect(renderExpr('foo + bar')).to.be.equal('scope.foo + scope.bar')
      })

      it('objects', () => {
        expect(renderExpr('{ foo: bar, buz: baz }')).to.be.equal('{ foo: scope.bar, buz: scope.baz }')
        expect(renderExpr('{ foo: { foo: bar, buz: baz }, buz: baz }')).to.be.equal('{ foo: { foo: scope.bar, buz: scope.baz }, buz: scope.baz }')
      })
    })
  })
})
