import { bindingTypes, expressionTypes, template } from '@riotjs/dom-bindings'
import {
  compile,
  generateSlotsFromString,
  generateTemplateFunctionFromString,
  registerPreprocessor,
} from '../src/index.js'
import { evaluateScript, getFixture, sassPreprocessor } from './helpers.js'
import { SourceMapConsumer } from 'source-map'
import { expect } from 'chai'
import pug from 'pug'
import riotParser from '@riotjs/parser'
import { unregister } from '../src/preprocessors.js'

describe('Core specs', () => {
  describe('Simple tags', () => {
    it('The compiler generates a sourcemap and an output', async function () {
      const result = compile(getFixture('my-component.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('my-component')
      expect(output.default).to.have.all.keys(
        'exports',
        'css',
        'template',
        'name',
      )

      sourcemapConsumer.destroy()
    })

    it('TypeScript script syntax is supported', function () {
      expect(() =>
        compile(getFixture('typescript-script-type.riot')),
      ).to.not.throw()
    })

    it('The compiler accepts also parsed components AST', async function () {
      const { parse } = riotParser()
      const parserResult = parse(getFixture('my-component.riot'))
      const result = compile(parserResult)
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('my-component')
      expect(output.default).to.have.all.keys(
        'exports',
        'css',
        'template',
        'name',
      )
    })

    it('String attributes should not be removed from the root node (https://github.com/riot/riot/issues/2761)', () => {
      const result = compile(getFixture('static-attributes.riot'))

      const output = evaluateScript(result.code)
      const { bindingsData } = output.default.template(
        template,
        expressionTypes,
        bindingTypes,
      )
      const staticAttribute = bindingsData[0].expressions[0]

      expect(staticAttribute).to.be.ok
      expect(staticAttribute.name).to.be.equal('class')
      expect(staticAttribute.evaluate()).to.be.equal('foo bar')
    })

    it('Tags without css and javascript can be properly compiled', async function () {
      const result = compile(getFixture('only-html.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('only-html')
      expect(output.default.css).to.be.not.ok
      expect(output.default.exports).to.be.not.ok
      expect(output.default.template).to.be.ok
    })

    it('Tags with weird namespaces can output properly css names', async function () {
      const result = compile(getFixture('weird-namespace.riot'))
      const output = evaluateScript(result.code)

      expect(output.default.css).to.be.a('string')
      expect(output.default.css).to.include('weird\\:namespace')
      expect(output.default.css).to.include("content: '\\263c';")
    })

    it('It can compile an entire HTML Page', async function () {
      const result = compile(getFixture('root-app.riot'))

      expect(result.code).to.match(/<script/)
    })

    it('Tags without html and javascript can be properly compiled', async function () {
      const result = compile(getFixture('only-css.riot'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('only-css')
      expect(output.default.css).to.be.ok
      expect(output.default.exports).to.be.not.ok
      expect(output.default.template).to.be.not.ok
    })

    it('Tags without html and css can be properly compiled', async function () {
      const result = compile(getFixture('only-javascript.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('only-javascript')

      expect(output.default.css).to.be.not.ok
      expect(output.default.exports).to.be.ok
      expect(output.default.template).to.be.not.ok
    })

    it('Tags with empty template with attributes can be properly compiled (https://github.com/riot/riot/issues/2931)', async function () {
      const result = compile(getFixture('empty-template-with-attributes.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('empty-template-with-attributes')

      expect(output.default.css).to.be.not.ok
      expect(output.default.exports).to.be.ok
      expect(output.default.template).to.be.ok
    })

    it('Tags with empty <script> generate a sourcemap and an output', async function () {
      const result = compile(getFixture('empty-script.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('empty-script')
      expect(output.default).to.have.all.keys(
        'exports',
        'css',
        'template',
        'name',
      )

      sourcemapConsumer.destroy()
    })

    it('Tags with empty <style> generate a sourcemap and an output', async function () {
      const result = compile(getFixture('empty-style.riot'))
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('empty-style')
      expect(output.default).to.have.all.keys(
        'exports',
        'css',
        'template',
        'name',
      )

      sourcemapConsumer.destroy()
    })

    it('The each directives on custom tags will be properly generate the attributes', function () {
      const result = compile(getFixture('each-and-events.riot'))

      expect(
        result.code.match(/'expr/g),
        "nested templates shouldn't have selectors",
      ).to.have.length(1)
      expect(result.code).to.match(/EVENT/)
    })

    it('Dynamic import is supported', function () {
      expect(() => compile(getFixture('dynamic-import.riot'))).to.not.throw()
    })

    it('Multiline expressions are supported - https://github.com/riot/riot/issues/2889', function () {
      expect(() =>
        compile(getFixture('multiline-expressions.riot')),
      ).to.not.throw()
    })

    it('Object expressions get properly computed - https://github.com/riot/compiler/issues/155', function () {
      const result = compile(getFixture('object-expression.riot'))

      const output = evaluateScript(result.code)
      const { bindingsData } = output.default.template(
        template,
        expressionTypes,
        bindingTypes,
      )

      expect(bindingsData).to.be.ok
    })

    it('Multiple root nodes are not supported', function () {
      expect(() =>
        compile(getFixture('multiple-root-nodes-script.riot')),
      ).to.throw(/Multiple/)
      expect(() =>
        compile(getFixture('multiple-root-nodes-css.riot')),
      ).to.throw(/Multiple/)
      expect(() =>
        compile(getFixture('multiple-root-nodes-html.riot')),
      ).to.throw(/Multiple/)
      expect(() =>
        compile(getFixture('multiple-root-nodes-comment.riot')),
      ).to.not.throw()
    })

    it('Nested svg tags should not throw (https://github.com/riot/riot/issues/2723)', function () {
      expect(() => compile(getFixture('svg-loader.riot'))).to.not.throw()
    })

    it('Text expressions on the same nodes should be merged', function () {
      const result = compile(getFixture('comments-component.riot'))
      const output = evaluateScript(result.code)
      const { bindingsData } = output.default.template(
        template,
        expressionTypes,
        bindingTypes,
      )
      const expressions = bindingsData[0].expressions

      expect(result.code).to.not.match(/<!--/)

      expect(expressions).to.have.length(1)
      expect(expressions[0].evaluate()).to.be.equal(
        'above the commentbelow the comment',
      )
    })

    it('Text expressions on the same nodes should be merged if the comments=true option is set', function () {
      const result = compile(getFixture('comments-component.riot'), {
        comments: true,
      })
      const output = evaluateScript(result.code)
      const { bindingsData } = output.default.template(
        template,
        expressionTypes,
        bindingTypes,
      )

      expect(result.code).to.match(/<!--/)
      expect(bindingsData[0].expressions).to.have.length(2)
    })
  })

  describe('Preprocessed tags', () => {
    before(() => {
      registerPreprocessor('css', 'sass', sassPreprocessor)
      registerPreprocessor('template', 'pug', (code, { file }) => {
        return {
          code: pug.render(code, {
            filename: file,
          }),
          map: {},
        }
      })
    })

    after(() => {
      unregister('css', 'sass')
      unregister('template', 'pug')
    })

    it('The Pug and sass preprocessors work as expected', async function () {
      const input = getFixture('pug-component.pug')
      const result = compile(input, {
        template: 'pug',
        file: 'pug-component.pug',
      })
      const output = evaluateScript(result.code)
      const sourcemapConsumer = await new SourceMapConsumer(result.map)

      expect(result.map.sources).to.have.length(1)
      expect(result.map.sourcesContent[0]).to.be.equal(input)
      expect(sourcemapConsumer.hasContentsOfAllSources()).to.be.ok
      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(result.meta).to.be.an('object')
      expect(result.meta.tagName).to.be.equal('pug-component')
      expect(output.default).to.have.all.keys(
        'exports',
        'css',
        'template',
        'name',
      )
      expect(output.default.exports.foo).to.be.ok
    })
  })

  describe('Template bindings generation', () => {
    it('No bindings', () => {
      const code = generateTemplateFunctionFromString('<p>hello</p>')

      expect(code).to.be.match(/<p>hello<\/p>/)
    })

    it('With bindings', () => {
      const code = generateTemplateFunctionFromString(
        '<p if="{visible}">hello</p>',
      )

      expect(code).to.be.match(/<\/p>/)
      expect(code).to.match(/bindingTypes\.IF/)
    })
  })

  describe('Runtime Slots generation', () => {
    it('Single Slot', () => {
      const code = generateSlotsFromString(
        '<my-component><p>hello</p></my-component>',
      )

      expect(code).to.be.match(/id: 'default'/)
      expect(code).to.be.match(/html: '<p>hello<\/p>'/)
    })

    it('Multiple Slot', () => {
      const code = generateSlotsFromString(
        '<my-component><h1 slot="title">title</h1><p>hello</p></my-component>',
      )

      expect(code).to.be.match(/id: 'title'/)
      expect(code).to.be.match(/id: 'default'/)
    })

    it('Slot with expressions', () => {
      const code = generateSlotsFromString(
        '<my-component><h1 slot="title">title</h1><p>hello {user}!</p></my-component>',
      )

      expect(code).to.be.match(/id: 'title'/)
      expect(code).to.be.match(/id: 'default'/)
    })
  })
})
