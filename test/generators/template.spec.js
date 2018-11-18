import {
  BINDING_CONDITION_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TYPE_KEY
} from '../../src/generators/template/constants'
import {evaluateScript, renderExpression} from '../helpers'
import {bindingTypes} from '@riotjs/dom-bindings'
import compose from '../../src/utils/compose'
import each from '../../src/generators/template/each'
import {expect} from 'chai'
import recast from 'recast'
import riotParser from '@riotjs/parser'
import {toScopedFunction} from '../../src/generators/template/utils'

const FAKE_SRC_FILE = 'fake-file.js'
const renderExpr = compose(
  renderExpression,
  toScopedFunction,
  expr => ({ text: expr })
)

const evaluateOutput = (ast, components = {}) => evaluateScript(`
  import { bindingTypes, expressionTypes }, template from '@riotjs/dom-bindings'

  export default function output(components) {
    return ${recast.print(ast).code}
  };
`).default(components)
const parse = input => riotParser().parse(input).output

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

      it('context transform', () => {
        expect(renderExpr('this.foo + this.bar')).to.be.equal('scope.foo + scope.bar')
        expect(renderExpr('this + this')).to.be.equal('scope + scope')
      })

      it('objects', () => {
        expect(renderExpr('{ foo: bar, buz: baz }')).to.be.equal('{ foo: scope.bar, buz: scope.baz }')
        expect(renderExpr('{ foo: { foo: bar, buz: baz }, buz: baz }')).to.be.equal('{ foo: { foo: scope.bar, buz: scope.baz }, buz: scope.baz }')
      })

      it('arrays', () => {
        expect(renderExpr('[foo, \'bar\', baz]')).to.be.equal('[scope.foo, \'bar\', scope.baz]')
      })

      it('classes declaration', () => {
        expect(renderExpr('class Foo {}')).to.be.equal('class Foo {}')
        expect(renderExpr('class Foo extends Bar {}')).to.be.equal('class Foo extends Bar {}')
      })

      it('classes instances', () => {
        expect(renderExpr('new Foo()')).to.be.equal('new scope.Foo()')
      })

      it('functions declaration', () => {
        expect(renderExpr('(foo) => bar + foo')).to.be.equal('(foo) => scope.bar + foo')
        expect(renderExpr('(foo) => (bar) => foo + bar + baz')).to.be.equal('(foo) => (bar) => foo + bar + scope.baz')
      })
    })
  })

  describe('Each bindings', () => {

    it('Each expression simple', () => {
      const source = '<li each={item in items}>{item}</li>'
      const { template } = parse(source)
      const input = each(template, 'li', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.not.ok
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('li')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
    })
  })
})
