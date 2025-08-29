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
  BINDING_IS_BOOLEAN_ATTRIBUTE,
  BINDING_NAME_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TEMPLATE_KEY,
  BINDING_TYPE_KEY,
  NAME_ATTRIBUTE,
} from '../../src/generators/template/constants.js'
import { bindingTypes, expressionTypes } from '@riotjs/dom-bindings'
import {
  createRootNode,
  toScopedFunction,
} from '../../src/generators/template/utils.js'
import { evaluateScript, renderExpression } from '../helpers.js'
import builder from '../../src/generators/template/builder.js'
import { builders } from '../../src/utils/build-types.js'
import compose from 'cumpa'
import curry from 'curri'
import eachBinding from '../../src/generators/template/bindings/each.js'
import { expect } from 'chai'
import generateJavascript from '../../src/utils/generate-javascript.js'
import ifBinding from '../../src/generators/template/bindings/if.js'
import { mergeNodeExpressions } from '../../src/generators/template/expressions/text.js'
import riotParser from '@riotjs/parser'
import simpleBinding from '../../src/generators/template/bindings/simple.js'
import slotBinding from '../../src/generators/template/bindings/slot.js'
import tagBinding from '../../src/generators/template/bindings/tag.js'

const FAKE_SRC_FILE = 'fake-file.js'
const renderExpr = compose(renderExpression, toScopedFunction, (expr) => ({
  text: expr,
}))

const renderTextNode = (node, source) =>
  generateJavascript(
    mergeNodeExpressions(node, FAKE_SRC_FILE, source),
  ).code.replace(/\.join\(([\r\n]|.)+/, '')

const getSlotById = (slots, id) =>
  slots.find((slot) => slot[BINDING_ID_KEY] === id)
const removeIdFromExpessionBindings = (str) =>
  str.replace(/expr(\d+)="expr(\d+)"/g, 'expr')
const buildSimpleTemplate = compose(
  removeIdFromExpessionBindings,
  (res) => res[0],
  builder,
)

const evaluateOutput = (ast, getComponent = () => null) =>
  evaluateScript(`
  import { bindingTypes, expressionTypes, template } from '@riotjs/dom-bindings'

  export default function output(getComponent) {
    return ${generateJavascript(ast).code}
  }
`).default(getComponent)
const parse = (input, options) => riotParser(options).parse(input).output

describe('Generators - Template', () => {
  describe('Utils', () => {
    describe('Expressions rendering', () => {
      it('simple', () => {
        expect(renderExpr('foo')).to.be.equal('_scope.foo')
      })

      it('throw in case of missing expression', () => {
        expect(() => renderExpr('')).to.throw
      })

      it('primitives', () => {
        expect(renderExpr('true')).to.be.equal('true')
        expect(renderExpr('1 > 2')).to.be.equal('1 > 2')
        expect(renderExpr('null')).to.be.equal('null')
        expect(renderExpr("'hello'")).to.be.equal("'hello'")
        expect(renderExpr('undefined')).to.be.equal('undefined')
        expect(renderExpr('RegExp')).to.be.equal('RegExp')
        expect(renderExpr('Number')).to.be.equal('Number')
        expect(renderExpr('Boolean')).to.be.equal('Boolean')
        expect(renderExpr('Array')).to.be.equal('Array')
      })

      it('primitive calls', () => {
        expect(renderExpr('Array.from(foo.bar)')).to.be.equal(
          'Array.from(_scope.foo.bar)',
        )
        expect(renderExpr('window.isNaN(foo.bar)')).to.be.equal(
          'window.isNaN(_scope.foo.bar)',
        )
        expect(renderExpr('new RegExp(foo.bar, "g")')).to.be.equal(
          'new RegExp(_scope.foo.bar, "g")',
        )
        expect(renderExpr('(new Date()).getFullYear()')).to.be.equal(
          '(new Date()).getFullYear()',
        )
        expect(renderExpr('(new Date(state.test)).getFullYear()')).to.be.equal(
          '(new Date(_scope.state.test)).getFullYear()',
        )
        expect(renderExpr('"this".toUpperCase().toLowerCase()')).to.be.equal(
          '"this".toUpperCase().toLowerCase()',
        )
      })

      it('simple sum', () => {
        expect(renderExpr('foo + bar')).to.be.equal('_scope.foo + _scope.bar')
      })

      it('scoped functions', () => {
        expect(renderExpr('foo.toUppercase()')).to.be.equal(
          '_scope.foo.toUppercase()',
        )
        expect(renderExpr('foo()')).to.be.equal('_scope.foo()')
        expect(
          renderExpr('props.messageTypes.get(message.type).hue'),
        ).to.be.equal('_scope.props.messageTypes.get(_scope.message.type).hue')
      })

      it('global scope objects', () => {
        expect(renderExpr('window.foo.toUppercase()')).to.be.equal(
          'window.foo.toUppercase()',
        )
        expect(renderExpr('CSS')).to.be.equal('_scope.CSS')
        expect(renderExpr('window.CSS')).to.be.equal('window.CSS')
        expect(renderExpr('window.foo')).to.be.equal('window.foo')
        expect(renderExpr('window["foo"].bar')).to.be.equal('window["foo"].bar')
        expect(renderExpr('console.log("hello")')).to.be.equal(
          'console.log("hello")',
        )
        expect(renderExpr('console.log(item)')).to.be.equal(
          'console.log(_scope.item)',
        )
      })

      it('context transform', () => {
        expect(renderExpr('this.foo + this.bar')).to.be.equal(
          '_scope.foo + _scope.bar',
        )
        expect(renderExpr('this.state.foo')).to.be.equal('_scope.state.foo')
        expect(renderExpr('this["bar"].foo')).to.be.equal('_scope["bar"].foo')
        expect(renderExpr('this + this')).to.be.equal('_scope + _scope')
      })

      it('objects', () => {
        expect(renderExpr('{ foo: bar, buz: baz }')).to.be.equal(
          '({  foo: _scope.bar, buz: _scope.baz})',
        )
        expect(renderExpr('{ foo, buz }')).to.be.equal(
          '({  foo: _scope.foo, buz: _scope.buz})',
        )
        expect(renderExpr('{ foo: i%2 }')).to.be.equal('({  foo: _scope.i%2})')
        expect(
          renderExpr('{ foo: { foo: bar, buz: baz }, buz: baz }'),
        ).to.be.equal(
          '({  foo: { foo: _scope.bar, buz: _scope.baz }, buz: _scope.baz})',
        )
      })

      it('arrays', () => {
        expect(renderExpr("[foo, 'bar', baz]")).to.be.equal(
          "[_scope.foo, 'bar', _scope.baz]",
        )
        expect(renderExpr("[foo, 'bar', baz].join(' ')")).to.be.equal(
          "[_scope.foo, 'bar', _scope.baz].join(' ')",
        )
      })

      it('classes declaration', () => {
        expect(renderExpr('class Foo {}')).to.be.equal('class Foo {}')
        expect(renderExpr('class Foo extends Bar {}')).to.be.equal(
          'class Foo extends Bar {}',
        )
      })

      it('classes instances', () => {
        expect(renderExpr('new Foo()')).to.be.equal('new _scope.Foo()')
      })

      it('computed member expressions', () => {
        expect(renderExpr('foo[bar]')).to.be.equal('_scope.foo[_scope.bar]')
        expect(renderExpr('foo[bar][baz]')).to.be.equal(
          '_scope.foo[_scope.bar][_scope.baz]',
        )
        expect(renderExpr('foo.bar[baz]')).to.be.equal(
          '_scope.foo.bar[_scope.baz]',
        )
        expect(renderExpr('foo.bar[baz].buz')).to.be.equal(
          '_scope.foo.bar[_scope.baz].buz',
        )
        expect(renderExpr('foo.bar[Symbol]')).to.be.equal(
          '_scope.foo.bar[Symbol]',
        )
      })

      it('functions declaration', () => {
        expect(renderExpr('(foo) => bar + foo')).to.be.equal(
          'foo => _scope.bar + foo',
        )
        expect(renderExpr('(foo) => (bar) => foo + bar + baz')).to.be.equal(
          'foo => (bar) => foo + bar + _scope.baz',
        )
        expect(
          renderExpr('(foo) => (event) => foo + event.target.value + baz'),
        ).to.be.equal('foo => (event) => foo + event.target.value + _scope.baz')
        expect(renderExpr("() => update({ message: 'hello' })")).to.be.equal(
          "() => _scope.update({ message: 'hello' })",
        )
        expect(
          renderExpr(`() => {
        update({ message: "ok" })
        }`),
        ).to.be.equal(
          '() => {        _scope.update({ message: "ok" })        }',
        )
      })

      it('functions object arguments', () => {
        expect(renderExpr('classNames({active: item.isActive})')).to.be.equal(
          '_scope.classNames({active: _scope.item.isActive})',
        )
      })

      it('parenthesis precedence expressions', () => {
        expect(renderExpr('(!state.property).toString()')).to.be.equal(
          '(!_scope.state.property).toString()',
        )
        expect(renderExpr('(props.name+"foo").toUpperCase()')).to.be.equal(
          '(_scope.props.name+"foo").toUpperCase()',
        )
      })

      it('support for optional chaining and null coalescing', () => {
        expect(renderExpr('state?.message')).to.be.equal(
          '_scope.state?.message',
        )
        expect(renderExpr('state.fn?.()')).to.be.equal('_scope.state.fn?.()')
        expect(renderExpr('state.name ?? state.surname')).to.be.equal(
          '_scope.state.name ?? _scope.state.surname',
        )
      })
    })
  })

  describe('Simple bindings', () => {
    it('Multiple expressions will be merged with the plain text', () => {
      const source = '<p>{foo} + {bar}</p>'
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        "[\n  _scope.foo,\n  ' + ',\n  _scope.bar\n]",
      )
    })

    it('Complex single expression will be merged with the plain text', () => {
      const source = `
      <p>{foo}
      foo bar
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        "[\n  _scope.foo,\n  '\\n      foo bar\\n      bar'\n]",
      )
    })

    it('Escaped expression will be unescaped', () => {
      const source = `
      <p>\\{foo}
      {bar}
      foo bar
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        "[\n  '{foo}\\n      ',\n  _scope.bar,\n  '\\n      foo bar\\n      bar'\n]",
      )
    })

    it('Complex multiple expressions will be merged with the plain text', () => {
      const source = `
      <p>
      {foo} + {bar}
      foo bar   {baz}
      bar</p>`
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        "[\n  _scope.foo,\n  ' + ',\n  _scope.bar,\n  '\\n      foo bar   ',\n  _scope.baz,\n  '\\n      bar'\n]",
      )
    })

    it('Simple expressions will be left untouchted', () => {
      const source = '<p>{foo}</p>'
      const { template } = parse(source)

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        '_scope.foo',
      )
    })

    it('Different template brakets will be merged with the plain text', () => {
      const source = '<p>[[[[foo]]]] + [[[[bar]]]]</p>'
      const { template } = parse(source, {
        brackets: ['[[[[', ']]]]'],
      })

      expect(renderTextNode(template.nodes[0], source)).to.be.equal(
        "[\n  _scope.foo,\n  ' + ',\n  _scope.bar\n]",
      )
    })

    it('Simple attribute expression', () => {
      const source = '<li class={foo}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Custom boolean attribute on root tag', () => {
      const source = '<my-tag data-foo></my-tag>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(false)
      expect(expression[BINDING_NAME_KEY]).to.be.equal('data-foo')
      expect(expression[BINDING_EVALUATE_KEY]()).to.be.equal('')
    })

    it('Known boolean attribute on root tag toggles the BINDING_IS_BOOLEAN_ATTRIBUTE to true', () => {
      const source = '<my-tag checked></my-tag>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(true)
      expect(expression[BINDING_NAME_KEY]).to.be.equal('checked')
      expect(expression[BINDING_EVALUATE_KEY]()).to.be.equal('checked')
    })

    it('Known boolean attribute on custom nested tag toggles the BINDING_IS_BOOLEAN_ATTRIBUTE to true', () => {
      const source = '<div><my-tag checked={true}></my-tag></div>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.attributes[0]

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(true)
    })

    it('The "hidden" boolean attribute on custom tag enables the BINDING_IS_BOOLEAN_ATTRIBUTE flag', () => {
      const source = '<div><my-tag hidden={true}></my-tag></div>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.attributes[0]

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(true)
    })

    it('Custom boolean attribute on a child node', () => {
      const source = '<my-tag><input data-foo={undefined}/></my-tag>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.expressions[0]

      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(false)
    })

    it('Custom boolean attribute without value on a child node', () => {
      const source = '<parent><my-tag enabled></my-tag></parent>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.attributes[0]

      expect(expression[BINDING_EVALUATE_KEY]()).to.be.equal('')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(false)
    })

    it('Known boolean attribute on a child node', () => {
      const source = '<my-tag><input checked={undefined}/></my-tag>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.expressions[0]

      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(true)
    })

    it('Known boolean attribute on a select node https://github.com/riot/riot/issues/3000', () => {
      const source = `<my-tag>
<select name="customer">
    <option each={ customer in state.customers } value="{ customer.id }" selected="{ state.current.id === customer.id }">
       { customer.name }
    </option> 
</select></my-tag>`
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])
      const expression = output.template.bindingsData[0].expressions[2]

      expect(expression[BINDING_IS_BOOLEAN_ATTRIBUTE]).to.be.equal(true)
    })

    it('Spread attribute expression', () => {
      const source = '<li {...foo}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(
        expression[BINDING_EVALUATE_KEY]({ foo: { bar: 'bar' } }),
      ).to.be.deep.equal({ bar: 'bar' })
    })

    it('Object attribute expression', () => {
      const source = '<li foo={store}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.ok
      expect(
        expression[BINDING_EVALUATE_KEY]({ store: { foo: 'foo' } }),
      ).to.be.deep.equal({ foo: 'foo' })
    })

    it('Merge attribute expression with strings', () => {
      const source = '<li class="red {foo} bar"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.equal('class')

      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'red foo bar',
      )
    })

    it('Attribute expression containing html entities will be encoded', () => {
      const source =
        '<li class="&#x222; &euro; {foo} {\'&#222;\'} &#222;"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'Ȣ € foo &#222; Þ',
      )
    })

    it('Merge attribute expression with strings (static text at the end)', () => {
      const source = '<li class="{foo} bar"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo bar',
      )
    })

    it('Merge multiple attribute expressions', () => {
      const source = '<li class="{bar}__red {foo}"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(
        expression[BINDING_EVALUATE_KEY]({ foo: 'foo', bar: 'bar' }),
      ).to.be.equal('bar__red foo')
    })

    it('Merge multiple attribute expressions with spaces in expressions', () => {
      const source = '<li class="{ scope.bar }-{ scope.foo }"></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(
        expression[BINDING_EVALUATE_KEY]({ scope: { foo: 'foo', bar: 'bar' } }),
      ).to.be.equal('bar-foo')
    })

    it('Multiple attribute expressions', () => {
      const source = '<li class={foo} id={bar}></li>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const [classExpression, idExpression] = output.expressions

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(classExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(classExpression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(classExpression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(classExpression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )

      expect(idExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(idExpression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(idExpression[BINDING_NAME_KEY]).to.be.equal('id')
      expect(idExpression[BINDING_EVALUATE_KEY]({ bar: 'bar' })).to.be.equal(
        'bar',
      )
    })

    it('Multiple mixed attribute expressions', () => {
      const source = '<input class={foo} value={bar}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const [classExpression, valueExpression] = output.expressions

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(classExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(classExpression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(classExpression[BINDING_NAME_KEY]).to.be.equal('class')
      expect(classExpression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )

      expect(valueExpression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(valueExpression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.VALUE,
      )
      expect(valueExpression[BINDING_EVALUATE_KEY]({ bar: 'bar' })).to.be.equal(
        'bar',
      )
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
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Value expression on a div', () => {
      const source = '<div value={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Value expression on a progress tag will be transformed into an attribute', () => {
      const source = '<progress value={foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Simple ref expression', () => {
      const source = '<div ref={ref}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(expressionTypes.REF)
      expect(expression[BINDING_EVALUATE_KEY]({ ref: 'ref' })).to.be.equal(
        'ref',
      )
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
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Complex event expression', () => {
      const source = '<input oninput={() => foo}/>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })()).to.be.equal(
        'foo',
      )
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
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foo',
      )
    })

    it('Simple text expression (static text at the end)', () => {
      const source = '<div>{foo}bar</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]

      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'foobar',
      )
    })

    it('Simple text expression (static text at the beginning)', () => {
      const source = '<div>bar{foo}</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'barfoo',
      )
    })

    it('Simple text expression (static text at the beginning and at the end)', () => {
      const source = '<div>bar{foo}baz</div>'
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'barfoobaz',
      )
    })

    it('HTML entities in text expressions will be encoded', () => {
      const source = "<div>&#x222; &euro; {foo} {'&#222;'} &#222;</div>"
      const { template } = parse(source)
      const input = simpleBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.expressions[0]
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'foo' })).to.be.equal(
        'Ȣ € foo &#222; Þ',
      )
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
      expect(
        expression[BINDING_EVALUATE_KEY]({ foo: 'foo', bar: 'bar' }),
      ).to.be.equal('foo + bar')
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
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(2)
      expect(
        output[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({ foo: 'foo' }),
      ).to.be.equal('foo')

      expect(
        output[BINDING_ATTRIBUTES_KEY][1][BINDING_EVALUATE_KEY](),
      ).to.be.equal('my-id')
    })

    it('Children tags do not inherit "expr" and "is" attributes', () => {
      const source = '<div><p is="my-tag" class={foo} id="my-id"></p></div>'
      const { template } = parse(source)
      const bindings = evaluateOutput(
        builders.arrayExpression(builder(template, FAKE_SRC_FILE, source)[1]),
      )
      const tagBinding = bindings[0]

      expect(tagBinding[BINDING_SELECTOR_KEY]).to.be.ok
      expect(tagBinding[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(tagBinding[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')
      expect(tagBinding.slots).to.have.length(0)
      expect(tagBinding[BINDING_ATTRIBUTES_KEY]).to.have.length(2)
      expect(
        tagBinding[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({
          foo: 'foo',
        }),
      ).to.be.equal('foo')
      expect(
        tagBinding[BINDING_ATTRIBUTES_KEY][1][BINDING_EVALUATE_KEY](),
      ).to.be.equal('my-id')
    })

    it('Tag bindings can be computed', () => {
      const source = '<div><p is={tagName}/></div>'
      const { template } = parse(source)
      const bindings = evaluateOutput(
        builders.arrayExpression(builder(template, FAKE_SRC_FILE, source)[1]),
      )
      const tagBinding = bindings[0]

      expect(
        tagBinding[BINDING_EVALUATE_KEY]({ tagName: 'my-tag' }),
      ).to.be.equal('my-tag')
    })

    it('Tag bindings can be computed (bug https://github.com/riot/riot/issues/2935)', () => {
      const source = '<div><p is="my-{tagName}"/></div>'
      const { template } = parse(source)

      const bindings = evaluateOutput(
        builders.arrayExpression(builder(template, FAKE_SRC_FILE, source)[1]),
      )

      const tagBinding = bindings[0]

      expect(tagBinding[BINDING_EVALUATE_KEY]({ tagName: 'tag' })).to.be.equal(
        'my-tag',
      )
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
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(2)
      expect(
        output[BINDING_ATTRIBUTES_KEY][0][BINDING_EVALUATE_KEY]({ foo: 'foo' }),
      ).to.be.equal('foo')
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

      expect(
        removeIdFromExpessionBindings(defaultSlot[BINDING_HTML_KEY]),
      ).to.be.equal('<p expr> </p>')
      expect(defaultSlot[BINDING_BINDINGS_KEY]).to.have.length(1)
      expect(defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_SELECTOR_KEY]).to.be
        .ok
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
      expect(defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_SELECTOR_KEY]).to.be
        .not.ok
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
      expect(output[BINDING_ATTRIBUTES_KEY]).to.have.length(0)
    })

    it('Empty inherited slots do not create the HTML key', () => {
      const source = '<my-tag><slot name="default" slot="default"/></my-tag>'

      const { template } = parse(source)

      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const defaultSlot = output.slots[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')
      expect(defaultSlot[BINDING_HTML_KEY]).to.be.not.ok
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
    })

    it('Not empty inherited slots do create the HTML key', () => {
      const source =
        '<my-tag><slot name="default" slot="default">Hello there</slot></my-tag>'

      const { template } = parse(source)

      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const defaultSlot = output.slots[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.TAG)
      expect(output[BINDING_EVALUATE_KEY]()).to.be.equal('my-tag')
      expect(defaultSlot[BINDING_HTML_KEY]).to.be.equal(
        '<slot expr35="expr35" name="default" slot="default"></slot>',
      )
      expect(defaultSlot[BINDING_ID_KEY]).to.be.equal('default')
    })

    it('Tag binding on a custom input element', () => {
      const source = '<input is="bar" value="1"/>'
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output.attributes).to.have.length(1)
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

      expect(
        removeIdFromExpessionBindings(headerSlot[BINDING_HTML_KEY]),
      ).to.be.equal('<p expr slot="header"> </p>')
      expect(
        headerSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][
          BINDING_EVALUATE_KEY
        ]({ greeting: 'hi' }),
      ).to.have.be.equal('hi')

      expect(
        removeIdFromExpessionBindings(footerSlot[BINDING_HTML_KEY]),
      ).to.be.equal('<div expr slot="footer"> </div>')
      expect(
        footerSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][
          BINDING_EVALUATE_KEY
        ]({ footer: 'hi' }),
      ).to.have.be.equal('hi')

      expect(
        removeIdFromExpessionBindings(defaultSlot[BINDING_HTML_KEY]),
      ).to.be.equal('<b>hey</b><i expr> </i>')
      expect(
        defaultSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][
          BINDING_EVALUATE_KEY
        ]({ there: 'hi' }),
      ).to.have.be.equal('hi')
    })

    it('Slot <template> tags do not need selectors', () => {
      const source = `
        <my-tag>
          <template slot="header">{greeting}</template>
        </my-tag>
        `
      const { template } = parse(source)
      const input = tagBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const getSlot = curry(getSlotById)(output.slots)
      const headerSlot = getSlot('header')

      expect(
        removeIdFromExpessionBindings(headerSlot[BINDING_HTML_KEY]),
      ).to.be.equal(' ')
      expect(
        headerSlot[BINDING_BINDINGS_KEY][0][BINDING_EXPRESSIONS_KEY][0][
          BINDING_SELECTOR_KEY
        ],
      ).to.be.not.ok
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
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
    })

    it('Wrong each formats can not be parsed', () => {
      const source = '<li expr0 each={...items}>{item}</li>'
      const { template } = parse(source)

      expect(() =>
        eachBinding(template, 'expr0', FAKE_SRC_FILE, source),
      ).to.throw()
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
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
    })

    it('Each expression with condition index', () => {
      const source =
        '<li expr0 each={(item, index) in items} if={item > 1}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({ item: 2 })).to.be.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
    })

    it('Each expression with key attribute', () => {
      const source =
        '<li expr0 each={(item, index) in items} key={item} if={item > 1}>{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({ item: 2 })).to.be.ok
      expect(output[BINDING_GET_KEY_KEY]({ item: 2 })).to.be.equal(2)
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
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
      expect(output[BINDING_EVALUATE_KEY]({ items })).to.be.deep.equal([
        1, 2, 3,
      ])
    })

    it('Each cast a string attribute to expression', () => {
      const source =
        '<li expr0 each="(item, index) in items" if="item > 1">{item}</li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_CONDITION_KEY]).to.be.ok
      expect(output[BINDING_CONDITION_KEY]({ item: 2 })).to.be.ok
      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
    })

    it('Each binding on custom tag', () => {
      const source =
        '<my-tag expr0 each="(item, index) in items">{item}</my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_INDEX_NAME_KEY]).to.be.equal('index')
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')
      expect(output[BINDING_TYPE_KEY]).to.be.equal(bindingTypes.EACH)
      expect(output[BINDING_TEMPLATE_KEY]).to.be.a('object')
      expect(output[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(
        output[BINDING_EVALUATE_KEY]({ items: [1, 2, 3] }),
      ).to.be.deep.equal([1, 2, 3])
    })

    it('Spread + each attribute expression', () => {
      const source = '<li each={item in items} {...foo}></li>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      const expression = output.template.bindingsData[0].expressions[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(
        expression[BINDING_EVALUATE_KEY]({ foo: { bar: 'bar' } }),
      ).to.be.deep.equal({ bar: 'bar' })
    })

    it('Spread + each attribute on custom node', () => {
      const source = '<my-tag each={item in items} {...foo}></my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)
      const expression = output.template.bindingsData[0].attributes[0]

      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.not.ok
      expect(
        expression[BINDING_EVALUATE_KEY]({ foo: { bar: 'bar' } }),
      ).to.be.deep.equal({ bar: 'bar' })
    })

    it('Expression attributes + each attribute on custom node', () => {
      const source =
        '<my-tag each={item in items} foo={foo} bar="bar"></my-tag>'
      const { template } = parse(source)
      const input = eachBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      const expression = output.template.bindingsData[0].attributes[0]

      expect(
        output.template.bindingsData[0].attributes,
        'static attributes should also be parsed as expressions',
      ).to.have.length(2)
      expect(output[BINDING_SELECTOR_KEY]).to.be.equal('[expr0]')

      expect(expression[BINDING_EVALUATE_KEY]).to.be.a('function')
      expect(expression[BINDING_TYPE_KEY]).to.be.equal(
        expressionTypes.ATTRIBUTE,
      )
      expect(expression[BINDING_NAME_KEY]).to.be.ok
      expect(expression[BINDING_EVALUATE_KEY]({ foo: 'bar' })).to.be.deep.equal(
        'bar',
      )
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

      expect(
        output[BINDING_EVALUATE_KEY]({
          opts: {
            isVisible: false,
          },
        }),
      ).to.be.equal(false)
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

    it('Slot without fallback', () => {
      const source = '<slot message={ message } />'
      const { template } = parse(source)
      const input = slotBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = evaluateOutput(input)

      expect(output[BINDING_TEMPLATE_KEY]).to.be.not.ok
    })

    it('Slot with fallback (avoid duplicate attributes)', () => {
      const source = '<slot message={ message }><p>hi</p></slot>'

      const { template } = parse(source)
      const input = slotBinding(template, 'expr0', FAKE_SRC_FILE, source)
      const output = generateJavascript(input).code

      // no expressions should be generated in the template fallback
      // the slot root attributes should be removed
      expect(output).to.not.match(/expressions/)
    })

    it('Slot fallback html', () => {
      const source =
        '<div><slot><ul><li each={item in items}>{item}</li></ul></slot></div>'
      const { template } = parse(source)
      const [, bindings] = builder(
        createRootNode(template),
        FAKE_SRC_FILE,
        source,
      )
      const output = evaluateOutput(bindings[0])

      // the fallback template is defined
      expect(output[BINDING_TEMPLATE_KEY]).to.be.ok
      // the each binding should be part of the fallback template
      expect(bindings).to.have.length(1)
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

    it("You don't know HTML, void tags correction", () => {
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

    it('Slot Template Tags without if and each bindings will be removed', () => {
      const source = '<template slot="hello"></template>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('')
    })

    it('Slot Template Tags with if bindings will be rendered', () => {
      const source = '<template slot="hello" if={true}></template>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<template expr slot="hello"></template>')
    })

    it('Slot Template Tags with each bindings will be rendered', () => {
      const source = '<template slot="hello" if={item in [1, 2, 3]}></template>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<template expr slot="hello"></template>')
    })

    it('Template Tags with if bindings will be rendered', () => {
      const source = '<template if={true}></template>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<template expr></template>')
    })

    it('Template Tags with each bindings will be rendered', () => {
      const source = '<template if={item in [1, 2, 3]}></template>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, FAKE_SRC_FILE, source)

      expect(html).to.be.equal('<template expr></template>')
    })

    it("Slot shouldn't be considered custom tags", () => {
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
      expect(html).to.be.equal('<input expr is="binding"/>')
    })

    it('Event attributes on custom tags do not break the compiler (issue #124)', () => {
      const source =
        '<input type="text" name="txt" is="binding" onclick="void"/>'
      const { template } = parse(source)
      const html = buildSimpleTemplate(template, 'expr0', FAKE_SRC_FILE, source)
      expect(html).to.be.equal('<input expr is="binding"/>')
    })
  })
})
