import { register as registerPostproc, execute as runPostprocessors  } from './postprocessors'
import { register as registerPreproc, execute as runPreprocessor } from './preprocessors'
import cssTransformer from './transformers/css'
import curry from 'curri'
import javascriptTransformer from './transformers/javascript'
import riotParser from 'riot-parser'
import ruit from 'ruit'
import templateTransformer from './transformers/template'

/**
 * Generate the output code source together with the sourcemap
 * @param   { string } source - source code of the tag we will need to compile
 * @param { string } options - compiling options
 * @returns { Promise<Output> } object containing output code and source map
 */
export async function compile(source, options = {
  template: 'default'
}) {
  const { code, map } = await runPreprocessor('template', options.template, source, options)
  const { template, css, javascript } = riotParser(code, options)

  return await ruit({ code, map },
    curry(cssTransformer)(css, options),
    curry(templateTransformer)(template, options),
    curry(javascriptTransformer)(javascript, options),
    runPostprocessors,
  )
}


// This function can be used to register new preprocessors
// a preprocessor can target either only the css or javascript nodes
// or the complete tag source file ('template')
export const registerPreprocessor = registerPreproc

// This function can allow you to register postprocessors that will parse the output code
// here we can run prettifiers, eslint fixes...
export const registerPostprocessor = registerPostproc