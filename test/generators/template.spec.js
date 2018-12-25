import {
  BINDING_CONDITION_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_GET_KEY_KEY,
  BINDING_INDEX_NAME_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TEMPLATE_KEY,
  BINDING_TYPE_KEY
} from '../../src/generators/template/constants'
import {evaluateScript, renderExpression} from '../helpers'
import {bindingTypes} from '@riotjs/dom-bindings'
import compose from '../../src/utils/compose'
import eachBinding from '../../src/generators/template/bindings/each'
import {expect} from 'chai'
import ifBinding from '../../src/generators/template/bindings/if'
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
  import { bindingTypes, expressionTypes, template } from '@riotjs/dom-bindings'

  export default function output(components) {
    return ${recast.print(ast).code}
  }
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
        expect(renderExpr('1 > 2')).to.be.equal('1 > 2')
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
      const source = '<li expr0 each={item in items}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.not.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.not.ok
      expect(output[BINDING_GET_KEY_KEY]).to.be.not.ok
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })

    it('Each expression with index', () => {
      const source = '<li expr0 each={(item, index) in items}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.not.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })

    it('Each expression with condition index', () => {
      const source = '<li expr0 each={(item, index) in items} if={item > 1}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({item: 2})).to.be.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })

    it('Each expression with key attribute', () => {
      const source = '<li expr0 each={(item, index) in items} key={item} if={item > 1}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({item: 2})).to.be.ok
      expect(output[BINDING_GET_KEY_KEY]({item: 2})).to.be.equal(2)
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })

    it('Each complex expression', () => {
      const source = '<li expr0 each={(item, index) in items()}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const items = () => [1, 2, 3]

      expect(output[BINDING_CONDITION_KEY]).to.be.not
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items})).to.be.deep.equal([1,2,3])
    })

    it('Each cast a string attribute to expression', () => {
      const source = '<li expr0 each="(item, index) in items" if="item > 1">{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({item: 2})).to.be.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })
  })

  describe('If bindings', () => {
    it('If expression false', () => {
      const source = '<p expr0 if={1 > 2}>Hello</p>'
      const { template } = parse(source)
      const input = ifBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.IF)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')

      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal(false)
    })

    it('If expression truthy', () => {
      const source = '<p expr0 if={"foo bar"}>Hello</p>'
      const { template } = parse(source)
      const input = ifBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.IF)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')

      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('foo bar')
    })

    it('If expression nested object', () => {
      const source = '<p expr0 if={opts.isVisible}>Hello</p>'
      const { template } = parse(source)
      const input = ifBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.IF)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')

      expect(output[BINDING_EVALUATE_KEY]({ opts: {
        isVisible: false
      }})).to.be.equal(false)
    })
  })
})
