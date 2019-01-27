import { TAG_CSS_PROPERTY, TAG_LOGIC_PROPERTY, TAG_TEMPLATE_PROPERTY} from './generators/constants'
import { register as registerPostproc, execute as runPostprocessors  } from './postprocessors'
import { register as registerPreproc, execute as runPreprocessor } from './preprocessors'
import cssGenerator from './generators/css/index'
import curry from 'curri'
import generateAST from './utils/generate-ast'
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
 * @param { Sourcemap } map - initial sourcemap
 * @param { string } file - path to the original source file
 * @returns { AST } the initial AST
 *
 * @example
 * // the output represents the following string in AST
 */
export function createInitialInput(map, file) {
  const code = `export default { ${TAG_CSS_PROPERTY}: null, ${TAG_LOGIC_PROPERTY}: null, ${TAG_TEMPLATE_PROPERTY}: null }`
  return generateAST(code, {
    sourceFileName: file,
    inputSourceMap: map
  })
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

  const { code, map } = await runPreprocessor('template', opts.template, opts, source)
  const { template, css, javascript } = riotParser(opts).parse(code).output
  const meta = {
    options: opts,
    tagName: template.name,
    fragments: {
      template,
      css,
      javascript
    }
  }

  return ruit(
    createInitialInput(map),
    hookGenerator(cssGenerator, css, code, opts),
    hookGenerator(javascriptGenerator, javascript, code, opts),
    hookGenerator(templateGenerator, template, code, opts),
    ast => recast.print(ast, {
      sourceMapName: 'map.json'
    }),
    result => runPostprocessors(result, opts),
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
 * @param   { Object } options - compiling options
 * @returns { Promise<Output> } object containing output code and source map
 */
function hookGenerator(transformer, sourceNode, source, options) {
  if (!sourceNode || (sourceNode.nodes && !sourceNode.nodes.length)) {
    return result => result
  }

  return curry(transformer)(sourceNode, source, options)
}

// This function can be used to register new preprocessors
// a preprocessor can target either only the css or javascript nodes
// or the complete tag source file ('template')
export const registerPreprocessor = registerPreproc

// This function can allow you to register postprocessors that will parse the output code
// here we can run prettifiers, eslint fixes...
export const registerPostprocessor = registerPostproc