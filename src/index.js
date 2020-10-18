import {TAG_CSS_PROPERTY, TAG_LOGIC_PROPERTY, TAG_NAME_PROPERTY, TAG_TEMPLATE_PROPERTY} from './constants'
import {nullNode, simplePropertyNode} from './utils/custom-ast-nodes'
import {register as registerPostproc, execute as runPostprocessors} from './postprocessors'
import {register as registerPreproc, execute as runPreprocessor} from './preprocessors'
import {builders} from './utils/build-types'
import compose from 'cumpa'
import cssGenerator from './generators/css'
import curry from 'curri'
import generateJavascript from './utils/generate-javascript'
import hasHTMLOutsideRootNode from './utils/has-html-outside-root-node'
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
 * @returns { Promise<Output> } object containing output code and source map
 */
function hookGenerator(transformer, sourceNode, source, meta) {
  if (
    // filter missing nodes
    !sourceNode ||
    // filter nodes without children
    (sourceNode.nodes && !sourceNode.nodes.length) ||
    // filter empty javascript and css nodes
    (!sourceNode.nodes && !sourceNode.text)) {
    return result => result
  }

  return curry(transformer)(sourceNode, source, meta)
}

// This function can be used to register new preprocessors
// a preprocessor can target either only the css or javascript nodes
// or the complete tag source file ('template')
export const registerPreprocessor = registerPreproc

// This function can allow you to register postprocessors that will parse the output code
// here we can run prettifiers, eslint fixes...
export const registerPostprocessor = registerPostproc
