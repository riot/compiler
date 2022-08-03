import {TAG_CSS_PROPERTY, TAG_LOGIC_PROPERTY, TAG_NAME_PROPERTY, TAG_TEMPLATE_PROPERTY} from './constants'
import {callTemplateFunction, createTemplateDependenciesInjectionWrapper} from './generators/template/utils'
import {nullNode, simplePropertyNode} from './utils/custom-ast-nodes'
import {register as registerPostproc, execute as runPostprocessors} from './postprocessors'
import {register as registerPreproc, execute as runPreprocessor} from './preprocessors'
import build from './generators/template/builder'
import {builders} from './utils/build-types'
import compose from 'cumpa'
import {createSlotsArray} from './generators/template/bindings/tag'
import cssGenerator from './generators/css'
import curry from 'curri'
import generateJavascript from './utils/generate-javascript'
import hasHTMLOutsideRootNode from './utils/has-html-outside-root-node'
import isEmptyArray from './utils/is-empty-array'
import isEmptySourcemap from './utils/is-empty-sourcemap'
import javascriptGenerator from './generators/javascript'
import riotParser from '@riotjs/parser'
import sourcemapAsJSON from './utils/sourcemap-as-json'
import templateGenerator from './generators/template'

const DEFAULT_OPTIONS = {
  template: 'default',
  file: '[unknown-source-file]',
  scopedCss: true
}

/**
 * Create the initial AST
 * @param {string} tagName - the name of the component we have compiled
 * @returns { AST } the initial AST
 *
 * @example
 * // the output represents the following string in AST
 */
export function createInitialInput({ tagName }) {
  /*
  generates
  export default {
     ${TAG_CSS_PROPERTY}: null,
     ${TAG_LOGIC_PROPERTY}: null,
     ${TAG_TEMPLATE_PROPERTY}: null
  }
  */
  return builders.program([
    builders.exportDefaultDeclaration(
      builders.objectExpression([
        simplePropertyNode(TAG_CSS_PROPERTY, nullNode()),
        simplePropertyNode(TAG_LOGIC_PROPERTY, nullNode()),
        simplePropertyNode(TAG_TEMPLATE_PROPERTY, nullNode()),
        simplePropertyNode(TAG_NAME_PROPERTY, builders.literal(tagName))
      ])
    )]
  )
}

/**
 * Make sure the input sourcemap is valid otherwise we ignore it
 * @param   {SourceMapGenerator} map - preprocessor source map
 * @returns {Object} sourcemap as json or nothing
 */
function normaliseInputSourceMap(map) {
  const inputSourceMap = sourcemapAsJSON(map)
  return isEmptySourcemap(inputSourceMap) ? null : inputSourceMap
}

/**
 * Override the sourcemap content making sure it will always contain the tag source code
 * @param   {Object} map - sourcemap as json
 * @param   {string} source - component source code
 * @returns {Object} original source map with the "sourcesContent" property overridden
 */
function overrideSourcemapContent(map, source) {
  return {
    ...map,
    sourcesContent: [source]
  }
}

/**
 * Create the compilation meta object
 * @param { string } source - source code of the tag we will need to compile
 * @param { string } options - compiling options
 * @returns {Object} meta object
 */
function createMeta(source, options) {
  return {
    tagName: null,
    fragments: null,
    options: {
      ...DEFAULT_OPTIONS,
      ...options
    },
    source
  }
}

/**
 * Parse a string to simply get its template AST
 * @param { string } source - string to parse
 * @param { Object } options - parser options
 * @returns {Object} riot parser template output
 */
const parseSimpleString = (source, options) => {
  const { parse } = riotParser(options)
  return parse(source).output.template
}

/**
 * Generate the component slots creation function from the root node
 * @param { string } source - component outer html
 * @param { Object } parserOptions - riot parser options
 * @returns { string } content of the function that can be used to crate the slots in runtime
 */
export function generateSlotsFromString(source, parserOptions) {
  return compose(
    ({ code }) => code,
    generateJavascript,
    createTemplateDependenciesInjectionWrapper,
    createSlotsArray
  )(parseSimpleString(source, parserOptions), DEFAULT_OPTIONS.file, source)
}

/**
 * Generate the Riot.js binding template function from a template string
 * @param { string } source - template string
 * @param { Object } parserOptions - riot parser options
 * @returns { string } Riot.js bindings template function generated
 */
export function generateTemplateFunctionFromString(source, parserOptions) {
  return compose(
    ({ code }) => code,
    generateJavascript,
    callTemplateFunction
  )(
    ...build(
      parseSimpleString(source, parserOptions),
      DEFAULT_OPTIONS.file,
      source
    )
  )
}

/**
 * Generate the output code source together with the sourcemap
 * @param { string } source - source code of the tag we will need to compile
 * @param { Object } opts - compiling options
 * @returns { Output } object containing output code and source map
 */
export function compile(source, opts = {}) {
  const meta = createMeta(source, opts)
  const { options } = meta
  const { code, map } = runPreprocessor('template', options.template, meta, source)
  const { parse } = riotParser(options)
  const { template, css, javascript } = parse(code).output

  // see also https://github.com/riot/compiler/issues/130
  if (hasHTMLOutsideRootNode(template || css || javascript, code, parse)) {
    throw new Error('Multiple HTML root nodes are not supported')
  }

  // extend the meta object with the result of the parsing
  Object.assign(meta, {
    tagName: template.name,
    fragments: { template, css, javascript }
  })

  return compose(
    result => ({ ...result, meta }),
    result => runPostprocessors(result, meta),
    result => ({
      ...result,
      map: overrideSourcemapContent(result.map, source)
    }),
    ast => meta.ast = ast && generateJavascript(ast, {
      sourceMapName: `${options.file}.map`,
      inputSourceMap: normaliseInputSourceMap(map)
    }),
    hookGenerator(templateGenerator, template, code, meta),
    hookGenerator(javascriptGenerator, javascript, code, meta),
    hookGenerator(cssGenerator, css, code, meta)
  )(createInitialInput(meta))
}

/**
 * Prepare the riot parser node transformers
 * @param   { Function } transformer - transformer function
 * @param   { Object } sourceNode - riot parser node
 * @param   { string } source - component source code
 * @param   { Object } meta - compilation meta information
 * @returns { function(): Promise<Output> } Function what resolves to object containing output code and source map
 */
function hookGenerator(transformer, sourceNode, source, meta) {
  const hasContent = sourceNode && (sourceNode.text || !isEmptyArray(sourceNode.nodes) || !isEmptyArray(sourceNode.attributes))

  return hasContent ? curry(transformer)(sourceNode, source, meta) : result => result
}

// This function can be used to register new preprocessors
// a preprocessor can target either only the css or javascript nodes
// or the complete tag source file ('template')
export const registerPreprocessor = registerPreproc

// This function can allow you to register postprocessors that will parse the output code
// here we can run prettifiers, eslint fixes...
export const registerPostprocessor = registerPostproc
