import panic from './utils/panic'
import { transform } from './transformer'
/**
 * Parsers that can be registered by users to preparse components fragments
 * @type { Object }
 */
export const preprocessors = Object.freeze({
  javascript: new Map(),
  css: new Map(),
  template: new Map().set('default', code => { code })
})

/**
 * Register a custom preprocessor
 * @param   { string } type - parser type either 'js', 'css' or 'template'
 * @param   { string } name - unique parser id
 * @param   { Function } preprocessor - parser function
 * @returns { Function } - the parser function installed
 */
export function register(type, name, preprocessor) {
  if (!type) panic('Please define the type of parser you want to use \'javascript\', \'css\' or \'template\'')
  if (!name) panic('Please define a name for your parser')
  if (!preprocessor) panic('Please define your parser function')
  if (preprocessors[type].has(name)) panic(`The parser ${name} was already registered before`)

  preprocessors[type].add(name, preprocessor)

  return preprocessor
}

/**
 * Exec the compilation of a preprocessor
 * @param   { string } type - parser type either 'js', 'css' or 'template'
 * @param   { string } name - unique parser id
 * @param   { Object } options - preprocessor options
 * @param   { string } source - source code
 * @returns { Promise<Output> } object containing a sourcemap and a code string
 */
export async function execute(type, name, options, source) {
  if (!preprocessors[type]) panic(`No preprocessor of type "${type}" was found, please make sure to use one of these: 'javascript', 'css' or 'template'`)
  if (!preprocessors[type].has(name)) panic(`No preprocessor named "${name}" was found, are you sure you have registered it?'`)

  return await transform(preprocessors[type].get(name), options, source)
}