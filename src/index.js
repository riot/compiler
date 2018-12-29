import { TAG_CSS_PROPERTY, TAG_LOGIC_PROPERTY, TAG_TEMPLATE_PROPERTY} from './generators/constants'
import { register as registerPostproc, execute as runPostprocessors  } from './postprocessors'
import { register as registerPreproc, execute as runPreprocessor } from './preprocessors'
import cssGenerator from './generators/css/index'
import curry from 'curri'
import javascriptGenerator from './generators/javascript/index'
import recast from 'recast'
import riotParser from '@riotjs/parser'
import ruit from 'ruit'
import templateGenerator from './generators/template/index'

/**
 * Create the initial output
 * @param { Sourcemap } map - initial sourcemap
 * @returns { Output } containing the initial code and  AST
 *
 * @example
 * // the output represents the following string in AST
 */
export function createInitialInput(map) {
  const code = `export default { ${TAG_CSS_PROPERTY}: null, ${TAG_LOGIC_PROPERTY}: null, ${TAG_TEMPLATE_PROPERTY}: null }`
  return {
    ast: recast.parse(code),
    code,
    map
  }
}

/**
 * Generate the output code source together with the sourcemap
 * @param { string } source - source code of the tag we will need to compile
 * @param { string } options - compiling options
 * @returns { Promise<Output> } object containing output code and source map
 */
export async function compile(source, options = {
  template: 'default',
  file: '[unknown-source-file]'
}) {
  const { code, map } = await runPreprocessor('template', 'default', options, source)
  const { template, css, javascript } = riotParser(options).parse(code).output

  return ruit(createInitialInput(map),
    hookGenerator(cssGenerator, css, code, options),
    hookGenerator(javascriptGenerator, javascript, code, options),
    hookGenerator(templateGenerator, template, code, options),
    ({ ast }) => recast.prettyPrint(ast),
    runPostprocessors,
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
  if (!sourceNode) {
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