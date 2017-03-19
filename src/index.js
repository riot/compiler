import { parse } from './parser'

/**
 * Compile asynchronously a riot tag file into a valid pure js file
 * @param   { String } source  - the source code of riot tag file as string
 * @param   { String } source  - the source code of riot tag file as string
 * @param   { Object } options - user options object
 * @returns { Promise } output
 * @returns { Object } output.code - the generated javascript code
 * @returns { Object } output.map  - source map
 */
function compile(name, source, options = {}) {
  if (!name) throw 'Please specify the name of the tag you want to compile'
  return parse(name, source, options)
}

export default {
  compile
}