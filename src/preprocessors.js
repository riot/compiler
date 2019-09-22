import {panic} from '@riotjs/util/misc'
import { transform } from './transformer'
/**
 * Parsers that can be registered by users to preparse components fragments
 * @type { Object }
 */
export const preprocessors = Object.freeze({
  javascript: new Map(),
  css: new Map(),
  template: new Map().set('default', code => ({ code }))
})

// throw a processor type error
function preprocessorTypeError(type) {
  panic(`No preprocessor of type "${type}" was found, please make sure to use one of these: 'javascript', 'css' or 'template'`)
}

// throw an error if the preprocessor was not registered
function preprocessorNameNotFoundError(name) {
  panic(`No preprocessor named "${name}" was found, are you sure you have registered it?'`)
}

/**
 * Register a custom preprocessor
 * @param   { string } type - preprocessor type either 'js', 'css' or 'template'
 * @param   { string } name - unique preprocessor id
 * @param   { Function } preprocessor - preprocessor function
 * @returns { Map } - the preprocessors map
 */
export function register(type, name, preprocessor) {
  if (!type) panic('Please define the type of preprocessor you want to register \'javascript\', \'css\' or \'template\'')
  if (!name) panic('Please define a name for your preprocessor')
  if (!preprocessor) panic('Please provide a preprocessor function')
  if (!preprocessors[type]) preprocessorTypeError(type)
  if (preprocessors[type].has(name)) panic(`The preprocessor ${name} was already registered before`)

  preprocessors[type].set(name, preprocessor)

  return preprocessors
}

/**
 * Register a custom preprocessor
 * @param   { string } type - preprocessor type either 'js', 'css' or 'template'
 * @param   { string } name - unique preprocessor id
 * @returns { Map } - the preprocessors map
 */
export function unregister(type, name) {
  if (!type) panic('Please define the type of preprocessor you want to unregister \'javascript\', \'css\' or \'template\'')
  if (!name) panic('Please define the name of the preprocessor you want to unregister')
  if (!preprocessors[type]) preprocessorTypeError(type)
  if (!preprocessors[type].has(name)) preprocessorNameNotFoundError(name)

  preprocessors[type].delete(name)

  return preprocessors
}

/**
 * Exec the compilation of a preprocessor
 * @param   { string } type - preprocessor type either 'js', 'css' or 'template'
 * @param   { string } name - unique preprocessor id
 * @param   { Object } meta - preprocessor meta information
 * @param   { string } source - source code
 * @returns { Output } object containing a sourcemap and a code string
 */
export function execute(type, name, meta, source) {
  if (!preprocessors[type]) preprocessorTypeError(type)
  if (!preprocessors[type].has(name)) preprocessorNameNotFoundError(name)

  return transform(preprocessors[type].get(name), meta, source)
}