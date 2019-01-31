import { TAG_CSS_PROPERTY, TAG_LOGIC_PROPERTY, TAG_TEMPLATE_PROPERTY} from './generators/constants'
import { nullNode, simplePropertyNode } from './utils/custom-ast-nodes'
import { register as registerPostproc, execute as runPostprocessors  } from './postprocessors'
import { register as registerPreproc, execute as runPreprocessor } from './preprocessors'
import {builders} from './utils/build-types'
import cssGenerator from './generators/css/index'
import curry from 'curri'
import javascriptGenerator from './generators/javascript/index'
import recast from 'recast'
import riotParser from '@riotjs/parser'
import ruit from 'ruit'
import templateGenerator from './generators/template/index'

const DEFAULT_OPTIONS = {
  template: 'default',
  file: '[unknown-source-file]',
  scopedCss: true
}

/**
 * Create the initial AST
 * @returns { AST } the initial AST
 *
 * @example
 * // the output represents the following string in AST
 */
export function createInitialInput() {
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
        simplePropertyNode(TAG_TEMPLATE_PROPERTY, nullNode())
      ])
    )]
  )
}

/**
 * Generate the output code source together with the sourcemap
 * @param { string } source - source code of the tag we will need to compile
 * @param { string } options - compiling options
 * @returns { Promise<Output> } object containing output code and source map
 */
export async function compile(source, options = {}) {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options
  }
  const meta = {
    source,
    options: opts
  }

  const { code, map } = await runPreprocessor('template', opts.template, meta, source)
  const { template, css, javascript } = riotParser(opts).parse(code).output

  // extend the meta object with the result of the parsing
  Object.assign(meta, {
    tagName: template.name,
    fragments: {
      template,
      css,
      javascript
    }
  })

  return ruit(
    createInitialInput(),
    hookGenerator(cssGenerator, css, code, meta),
    hookGenerator(javascriptGenerator, javascript, code, meta),
    hookGenerator(templateGenerator, template, code, meta),
    ast => recast.print(ast, {
      sourceMapName: 'map.json',
      inputSourcemap: map
    }),
    result => runPostprocessors(result, meta),
    result => ({
      ...result,
      meta
    })
  )
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
  if (!sourceNode || (sourceNode.nodes && !sourceNode.nodes.length)) {
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