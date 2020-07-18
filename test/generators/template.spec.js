import {
  BINDING_ATTRIBUTES_KEY,
  BINDING_BINDINGS_KEY,
  BINDING_CONDITION_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_EXPRESSIONS_KEY,
  BINDING_GET_KEY_KEY,
  BINDING_HTML_KEY,
  BINDING_ID_KEY,
  BINDING_INDEX_NAME_KEY,
  BINDING_NAME_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TEMPLATE_KEY,
  BINDING_TYPE_KEY,
  NAME_ATTRIBUTE
} from '../../src/generators/template/constants'
import {bindingTypes, expressionTypes} from '@riotjs/dom-bindings'
import {createRootNode, toScopedFunction} from '../../src/generators/template/utils'
import {evaluateScript, renderExpression} from '../helpers'
import builder from '../../src/generators/template/builder'
import {builders} from '../../src/utils/build-types'
import compose from 'cumpa'
import curry from 'curri'
import eachBinding from '../../src/generators/template/bindings/each'
import {expect} from 'chai'
import generateJavascript from '../../src/utils/generate-javascript'
import ifBinding from '../../src/generators/template/bindings/if'
import {mergeNodeExpressions} from '../../src/generators/template/expressions/text'
import riotParser from '@riotjs/parser'
import simpleBinding from '../../src/generators/template/bindings/simple'
import slotBinding from '../../src/generators/template/bindings/slot'
import tagBinding from '../../src/generators/template/bindings/tag'

const FAKE_SRC_FILE = 'fake-file.js'
const renderExpr = compose(
  renderExpression,
  toScopedFunction,
  expr => ({ text: expr })
)

const renderTextNode = (node, source) => generateJavascript(
  mergeNodeExpressions(node, FAKE_SRC_FILE, source)
).code.replace('.join(\'\')', '')

const getSlotById = (slots, id) => slots.find(slot => slot[BINDING_ID_KEY] === id)
const removeIdFromExpessionBindings = str => str.replace(/expr(\d+)="expr(\d+)"/g, 'expr')
const buildSimpleTemplate = compose(removeIdFromExpessionBindings, res => res[0], builder)

const evaluateOutput = (ast, getComponent = () => null) => evaluateScript(`
  import { bindingTypes, expressionTypes, template } from '@riotjs/dom-bindings'

  export default function output(getComponent) {
    return ${generateJavascript(ast).code}
  }
`).default(getComponent)
const parse = (input, options) => riotParser(options).parse(input).output

describe('Generators - Template', () => {
  describe('Utils', () => {
    describe.only('Expressions rendering', () => {
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
        expect(renderExpr('Array')).to.be.equal('Array')
      })

      it('primitve calls', () => {
        expect(renderExpr('Array.from(foo.bar)')).to.be.equal('Array.from(scope.foo.bar)')
        expect(renderExpr('window.isNaN(foo.bar)')).to.be.equal('window.isNaN(scope.foo.bar)')
        expect(renderExpr('new RegExp(foo.bar, "g")')).to.be.equal('new RegExp(scope.foo.bar, "g")')
        expect(renderExpr('(new Date()).getFullYear()')).to.be.equal('(new Date()).getFullYear()')
        expect(renderExpr('(new Date(state.test)).getFullYear()')).to.be.equal('(new Date(scope.state.test)).getFullYear()')
        expect(renderExpr('"this".toUpperCase().toLowerCase()')).to.be.equal('"this".toUpperCase().toLowerCase()')
      })

      it('simple sum', () => {
        expect(renderExpr('foo + bar')).to.be.equal('scope.foo + scope.bar')
      })

      it('scoped functions', () => {
        expect(renderExpr('foo.toUppercase()')).to.be.equal('scope.foo.toUppercase()')
        expect(renderExpr('foo()')).to.be.equal('scope.foo()')
        expect(renderExpr('props.messageTypes.get(message.type).hue')).to.be.equal('scope.props.messageTypes.get(scope.message.type).hue')
      })

      it('global scope objects', () => {
        expect(renderExpr('window.foo.toUppercase()')).to.be.equal('window.foo.toUppercase()')
        expect(renderExpr('window.foo')).to.be.equal('window.foo')
        expect(renderExpr('window["foo"].bar')).to.be.equal('window["foo"].bar')
      })

      it.only('context transform', () => {
        expect(renderExpr('this.foo + this.bar')).to.be.equal('scope.foo + scope.bar')
        expect(renderExpr('this.state.foo')).to.be.equal('scope.state.foo')
        expect(renderExpr('this["bar"].foo')).to.be.equal('scope["bar"].foo')
        expect(renderExpr('this + this')).to.be.equal('scope + scope')
      })

      it('objects', () => {
        expect(renderExpr('{ foo: bar, buz: baz }')).to.be.equal('{ foo: scope.bar, buz: scope.baz }')
        expect(renderExpr('{ foo, buz }')).to.be.equal('{ foo: scope.foo, buz: scope.buz }')
        expect(renderExpr('{ foo: i%2 }')).to.be.equal('{ foo: scope.i%2 }')
        expect(renderExpr('{ foo: { foo: bar, buz: baz }, buz: baz }')).to.be.equal('{ foo: { foo: scope.bar, buz: scope.baz }, buz: scope.baz }')
      })

      it('arrays', () => {
        expect(renderExpr('[foo, \'bar\', baz]')).to.be.equal('[scope.foo, \'bar\', scope.baz]')
        expect(renderExpr('[foo, \'bar\', baz].join(\' \')')).to.be.equal('[scope.foo, \'bar\', scope.baz].join(\' \')')
      })

      it('classes declaration', () => {
        expect(renderExpr('class Foo {}')).to.be.equal('class Foo {}')
        expect(renderExpr('class Foo extends Bar {}')).to.be.equal('class Foo extends Bar {}')
      })

      it('classes instances', () => {
        expect(renderExpr('new Foo()')).to.be.equal('new scope.Foo()')
      })

      it('computed member expressions', () => {
        expect(renderExpr('foo[bar]')).to.be.equal('scope.foo[scope.bar]')
        expect(renderExpr('foo[bar][baz]')).to.be.equal('scope.foo[scope.bar][scope.baz]')
        expect(renderExpr('foo.bar[baz]')).to.be.equal('scope.foo.bar[scope.baz]')
        expect(renderExpr('foo.bar[baz].buz')).to.be.equal('scope.foo.bar[scope.baz].buz')
        expect(renderExpr('foo.bar[Symbol]')).to.be.equal('scope.foo.bar[Symbol]')
      })

      it('functions declaration', () => {
        expect(renderExpr('(foo) => bar + foo')).to.be.equal('(foo) => scope.bar + foo')
        expect(renderExpr('(foo) => (bar) => foo + bar + baz')).to.be.equal('(foo) => (bar) => foo + bar + scope.baz')
        expect(renderExpr('(foo) => (event) => foo + event.target.value + baz')).to.be.equal('(foo) => (event) => foo + event.target.value + scope.baz')
      })

      it('functions object arguments', () => {
        expect(renderExpr('classNames({active: item.isActive})')).to.be.equal('scope.classNames({active: scope.item.isActive})')
      })

      it('parethesis precedence expressions', () => {
        expect(renderExpr('(!state.property).toString()')).to.be.equal('(!scope.state.property).toString()')
        expect(renderExpr('(props.name+"foo").toUpperCase()')).to.be.equal('(scope.props.name+"foo").toUpperCase()')
      })
    })
  })

  describe('Simple bindings', () => {
    it('Multiple expressions will be merged with the plain text', () => {
      const source = '<p>{foo} + {bar}</p>'
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('[scope.foo, \' + \', scope.bar]')
    })

    it('Complex single expression will be merged with the plain text', () => {
      const source = `
      <p>{foo}
      foo bar
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('[scope.foo, \'\\n      foo bar\\n      bar\']')
    })

    it('Escaped expression will be unescaped', () => {
      const source = `
      <p>\\{foo}
      {bar}
      foo bar
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('[\'{foo}\\n      \', scope.bar, \'\\n      foo bar\\n      bar\']')
    })

    it('Complex multiple expressions will be merged with the plain text', () => {
      const source = `
      <p>
      {foo} + {bar}
      foo bar   {baz}
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('[\n  scope.foo,\n  \' + \',\n  scope.bar,\n  \'\\n      foo bar   \',\n  scope.baz,\n  \'\\n      bar\'\n]')
    })

    it('Simple expressions will be left untouchted', () => {
      const source = '<p>{foo}</p>'
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('scope.foo')
    })

    it('Different template brakets will be merged with the plain text', () => {
      const source = '<p>[[[[foo]]]] + [[[[bar]]]]</p>'
      const { template } = parse(source, {
        brackets: ['[[[[', ']]]]']
      })

      expect(renderTextNode(template.nodes[0], source)).to.be.equal('[scope.foo, \' + \', scope.bar]')
    })

    it('Simple attribute expression', () => {
      const source = '<li class={foo}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Custom boolean attribute on root tag', () => {
      const source = '<my-tag data-foo></my-tag>'
      const { template } = parse(source)
      const [,bindings] = builder(createRootNode(template), FAKE_SRC_FILE, source)
      const output = evaluateOutput(bindings[0])
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.equal('data-foo')
      expect(expression[BINDING_EVALUATE_KEY]()).to.be.equal('data-foo')
    })

    it('Spread attribute expression', () => {
      const source = '<li {...foo}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(expression[BINDING_EVALUATE_KEY]({foo: {bar: 'bar'}})).to.be.deep.equal({bar: 'bar'})
    })

    it('Object attribute expression', () => {
      const source = '<li foo={store}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.ok
      expect(expression[BINDING_EVALUATE_KEY]({store: {foo: 'foo'}})).to.be.deep.equal({foo: 'foo'})
    })

    it('Merge attribute expression with strings', () => {
      const source = '<li class="red {foo} bar"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.equal('class')

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('red foo bar')
    })

    it('Attribute expression containing html entities will be encoded', () => {
      const source = '<li class="&#x222; &euro; {foo} {\'&#222;\'} &#222;"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('Ȣ € foo &#222; Þ')
    })

    it('Merge attribute expression with strings (static text at the end)', () => {
      const source = '<li class="{foo} bar"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo bar')
    })

    it('Merge multiple attribute expressions', () => {
      const source = '<li class="{bar}__red {foo}"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo', bar: 'bar'})).to.be.equal('bar__red foo')
    })

    it('Merge multiple attribute expressions with spaces in expressions', () => {
      const source = '<li class="{ scope.bar }-{ scope.foo }"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({scope: {foo: 'foo', bar: 'bar'}})).to.be.equal('bar-foo')
    })

    it('Multiple attribute expressions', () => {
      const source = '<li class={foo} id={bar}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const [classExpression, idExpression] = output.expressions

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(classExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(classExpression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(classExpression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(classExpression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')

      expect(idExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(idExpression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(idExpression[BINDING_NAME_KEY]).to.be.equal('id')
      expect(idExpression[BINDING_EVALUATE_KEY]({bar: 'bar'})).to.be.equal('bar')
    })

    it('Multiple mixed attribute expressions', () => {
      const source = '<input class={foo} value={bar}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const [classExpression, valueExpression] = output.expressions

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(classExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(classExpression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(classExpression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(classExpression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')

      expect(valueExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(valueExpression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.VALUE)
      expect(valueExpression[BINDING_EVALUATE_KEY]({bar: 'bar'})).to.be.equal('bar')
    })

    it('Simple value expression', () => {
      const source = '<input value={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.VALUE)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Value expression on a div', () => {
      const source = '<div value={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Value expression on a progress tag will be transformed into an attribute', () => {
      const source = '<progress value={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Simple event expression', () => {
      const source = '<input oninput={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_NAME_KEY]).to.be.equal('oninput')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.EVENT)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Complex event expression', () => {
      const source = '<input oninput={() => foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})()).to.be.equal('foo')
    })

    it('Simple text expression', () => {
      const source = '<div>{foo}</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.TEXT)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Simple text expression (static text at the end)', () => {
      const source = '<div>{foo}bar</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foobar')
    })

    it('Simple text expression (static text at the beginning)', () => {
      const source = '<div>bar{foo}</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('barfoo')
    })

    it('Simple text expression (static text at the beginning and at the end)', () => {
      const source = '<div>bar{foo}baz</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('barfoobaz')
    })

    it('HTML entities in text expressions will be encoded', () => {
      const source = '<div>&#x222; &euro; {foo} {\'&#222;\'} &#222;</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('Ȣ € foo &#222; Þ')
    })

    it('Multiple text expressions', () => {
      const source = '<div>{foo} + {bar}</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.TEXT)
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'foo', bar: 'bar'})).to.be.equal('foo + bar')
    })
  })


  describe('Tag bindings', () => {
    it('Simple tag binding without slots', () => {
      const source = '<my-tag class={foo} id="my-id"></my-tag>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')
      expect(output.slots).to.have.length(0)
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(1)
      expect(output[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Children tags do not inherit "expr" and "is" attributes', () => {
      const source = '<div><p is="my-tag" class={foo} id="my-id"></p></div>'
      const { template } = parse(source)
      const bindings = evaluateOutput(
        builders.arrayExpression(builder(template, FAKE_SRC_FILE, source)[1])
      )
      const tagBinding = bindings[0]

      expect(tagBinding[BINDING_SELECTOR_KEY]).to.be.ok
      expect(tagBinding[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(tagBinding[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')
      expect(tagBinding.slots).to.have.length(0)
      expect(tagBinding[BINDING_ATTRIBUTES_KEY]).to.have.length(1)
      expect(tagBinding[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Simple tag binding with default slot', () => {
      const source = '<my-tag class={foo} id="my-id"><p>hello</p></my-tag>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const defaultSlot = output.slots[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')

      expect(defaultSlot[BINDING_HTML_KEY]).to.be.equal('<p>hello</p>')
      expect(defaultSlot[BINDING_BINDINGS_KEY]).to.be.deep.equal([])
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(1)
      expect(output[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({foo: 'foo'})).to.be.equal('foo')
    })

    it('Tag binding with default slot with expressions', () => {
      const source = '<my-tag><p>{greeting}</p></my-tag>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const defaultSlot = output.slots[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')

      expect(removeIdFromExpessionBindings(defaultSlot[BINDING_HTML_KEY]))
        .to.be.equal('<p expr> </p>')
      expect(defaultSlot[BINDING_BINDINGS_KEY]).to.have.length(1)
      expect(defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_SELECTOR_KEY]).to.be.ok
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(0)
    })

    it('Tag binding with default slot with only text expressions', () => {
      const source = '<my-tag>{greeting}</my-tag>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const defaultSlot = output.slots[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')

      expect(defaultSlot[BINDING_HTML_KEY]).to.be.equal(' ')
      expect(defaultSlot[BINDING_BINDINGS_KEY]).to.have.length(1)
      expect(defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_SELECTOR_KEY]).to.be.not.ok
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(0)
    })

    it('Tag binding on a custom input element', () => {
      const source = '<input is="bar" value="1"/>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output.attributes).to.have.length(0)
    })

    it('Tag binding with multiple slots with expressions', () => {
      const source = `
        <my-tag>
          <p slot="header">{greeting}</p>
          <b>hey</b>
          <div slot="footer">{footer}</div>
          <i>{there}</i>
        </my-tag>
        `
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const getSlot = curry(getSlotById)(output.slots)
      const headerSlot = getSlot('header')
      const footerSlot = getSlot('footer')
      const defaultSlot = getSlot('default')

      expect(removeIdFromExpessionBindings(headerSlot[BINDING_HTML_KEY]))
        .to.be.equal('<p expr slot="header"> </p>')
      expect(
        headerSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][BINDING_EVALUATE_KEY]({greeting: 'hi'}))
        .to.have.be.equal('hi')

      expect(removeIdFromExpessionBindings(footerSlot[BINDING_HTML_KEY]))
        .to.be.equal('<div expr slot="footer"> </div>')
      expect(
        footerSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][BINDING_EVALUATE_KEY]({footer: 'hi'}))
        .to.have.be.equal('hi')

      expect(removeIdFromExpessionBindings(defaultSlot[BINDING_HTML_KEY]))
        .to.be.equal('<b>hey</b><i expr> </i>')
      expect(
        defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][BINDING_EVALUATE_KEY]({there: 'hi'}))
        .to.have.be.equal('hi')
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

    it('Wrong each formats can not be parsed', () => {
      const source = '<li expr0 each={...items}>{item}</li>'
      const { template } = parse(source)

      expect(() => eachBinding(template, 'expr0', FAKE_SRC_FILE, source)).to.throw()
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

    it('Each binding on custom tag', () => {
      const source = '<my-tag expr0 each="(item, index) in items">{item}</my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(output[BINDING_EVALUATE_KEY]({items: [1,2,3]})).to.be.deep.equal([1,2,3])
    })

    it('Spread + each attribute expression', () => {
      const source = '<li each={item in items} {...foo}></li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      const expression = output.template.bindingsData[0].expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(expression[BINDING_EVALUATE_KEY]({foo: {bar: 'bar'}})).to.be.deep.equal({bar: 'bar'})
    })

    it('Spread + each attribute on custom node', () => {
      const source = '<my-tag each={item in items} {...foo}></my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.template.bindingsData[0].attributes[0]


      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(expression[BINDING_EVALUATE_KEY]({foo: {bar: 'bar'}})).to.be.deep.equal({bar: 'bar'})
    })

    it('Expression attributes + each attribute on custom node', () => {
      const source = '<my-tag each={item in items} foo={foo} bar="bar"></my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      const expression = output.template.bindingsData[0].attributes[0]

      expect(output.template.bindingsData[0].attributes, 'static attributes should\'t be parsed as expressions').to.have.length(1)
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.ATTRIBUTE)
      expect(expression[BINDING_NAME_KEY]).to.be.ok
      expect(expression[BINDING_EVALUATE_KEY]({foo: 'bar'})).to.be.deep.equal('bar')
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

    it('If expression on custom tag', () => {
      const source = '<my-tag expr0 if={1 > 2}>Hello</my-tag>'
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

    it('If expressions should not have redundant expression attributes', () => {
      const source = '<p expr0 if={1 > 2}>Hello</p>'
      const { template } = parse(source)
      const input = ifBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output.template.bindingsData[0]).to.be.not.ok
    })
  })

  describe('Slot bindings', () => {
    it('Default slot binding ', () => {
      const source = '<slot/>'
      const { template } = parse(source)
      const input = slotBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.SLOT)
      expect(output[NAME_ATTRIBUTE]).to.be.equal('default')
    })

    it('Custom slot binding ', () => {
      const source = '<slot name="foo"/>'
      const { template } = parse(source)
      const input = slotBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(0)
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.SLOT)
      expect(output[NAME_ATTRIBUTE]).to.be.equal('foo')
    })

    it('Slot with attributes ', () => {
      const source = '<slot message={ message } />'
      const { template } = parse(source)
      const input = slotBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(1)
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.SLOT)
      expect(output[NAME_ATTRIBUTE]).to.be.equal('default')
    })
  })

  describe('Template builder', () => {
    it('Throw in case of no template to parse', () => {
      expect(() => builder(null)).to.throw
    })

    it('No template no party', () => {
      const [html] = builder({}, FAKE_SRC_FILE, '')
      expect(html).to.be.equal('')
    })

    it('Simple node', () => {
      const source = '<p>foo bar</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal(source)
    })

    it('Simple text expression', () => {
      const source = '<p>your {name}</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p expr> </p>')
    })

    it('Multiple text expressions', () => {
      const source = '<p>{user} {name}</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p expr> </p>')
    })

    it('Boolean attribute', () => {
      const source = '<video loop muted></video>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal(source)
    })

    it('Spread attribute', () => {
      const source = '<div {...foo.bar}></div>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<div expr></div>')
    })

    it('Static attribute', () => {
      const source = '<video class="hello"></video>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal(source)
    })

    it('Simple if binding', () => {
      const source = '<p if={foo}>foo bar</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p expr></p>')
    })

    it('Escaped text expression', () => {
      const source = '<p>foo \\{bar}</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p>foo {bar}</p>')
    })

    it('Escaped attribute', () => {
      const source = '<p name="\\{bar}">foo</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p name="{bar}">foo</p>')
    })

    it('Simple each binding', () => {
      const source = '<p each={item in items}>{item}</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p expr></p>')
    })

    it('Each and if binding on the same tag', () => {
      const source = '<p each={item in items} if={foo}>{item}</p>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<p expr></p>')
    })

    it('Simple void tag', () => {
      const source = '<input/>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal(source)
    })

    it('You don\'t know HTML, void tags correction', () => {
      const source = '<img></img>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<img/>')
    })

    it('Simple tag binding', () => {
      const source = '<my-tag>foo bar</my-tag>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<my-tag expr></my-tag>')
    })

    it('Autoclose void tags', () => {
      const source = '<svg><circle></circle></svg>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<svg><circle/></svg>')
    })

    it('Custom self-closed tag binding', () => {
      const source = '<my-tag/>   '
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<my-tag expr></my-tag>')
    })

    it('Slot shouldn\'t be considered custom tags', () => {
      const source = '<slot/>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<slot expr></slot>')
    })

    it('Tag binding via is attribute', () => {
      const source = '<div is="my-tag">foo bar</div>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<div expr is="my-tag"></div>')
    })

    it('Nested list', () => {
      const source = '<ul><li>1</li><li>2</li><li>3</li></ul>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal(source)
    })

    it('Nested list with expression', () => {
      const source = '<ul><li>1</li><li>{two}</li><li>3</li></ul>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<ul><li>1</li><li expr> </li><li>3</li></ul>')
    })

    it('Value attributes on custom tags do not break the compiler (issue #124)', () => {
      const source = '<input type="text" name="txt" is="binding" value="1"/>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, 'expr0', FAKE_SRC_FILE, source)
      expect(html).to.be.equal('<input expr type="text" name="txt" is="binding" value="1"/>')
    })

    it('Event attributes on custom tags do not break the compiler (issue #124)', () => {
      const source = '<input type="text" name="txt" is="binding" onclick="void"/>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, 'expr0', FAKE_SRC_FILE, source)
      expect(html).to.be.equal('<input expr type="text" name="txt" is="binding" onclick="void"/>')
    })
  })
})
