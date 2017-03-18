import { SourceMapGenerator } from 'source-map'
import esprima from 'esprima'

// Riot tags fragments
const SCRIPT = /<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi
const TEMPLATE = /<template(\s+[^>]*)?>\n?([\S\s]*?)<\/template\s*>/gi
const STYLE = /<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi
const TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i

function sourcemap(source, code, generated) {
  const map = new SourceMapGenerator({ file: generated })
  map.setSourceContent(source, code)
  return map
}

/**
 * Get a fragment single fragment
 * @param   { String } source - source code of the tag we will need to compile
 * @param   { RegExp } regExp - regular expression used to find the fragment
 * @returns { Object } output
 * @returns { String } output.type - the "type" attribute used on the current fragment
 * @returns { String } output.code - the code contained in this fragment
 */
function getFragment(source, regExp) {
  const match = regExp.exec(source)
  return match ? {
    // get the type="whathever" attribute
    type: match[1] ? TYPE_ATTR.exec(match[1])[2] : null,
    code: match[2]
  } : null
}

/**
 * Generate the output code together with the sourcemap
 * @param   { String } source  - source code of the tag we will need to compile
 * @param   { Object } options - user options
 * @returns { Promise } output
 * @returns { String } output.code
 * @returns { String } output.map
 * @returns { String } output.fragments
 */
function generate(source, options) {
  new Promise((resolve, reject) => {
    const fragments = {
      css: getFragment(STYLE),
      js: getFragment(SCRIPT),
      template: getFragment(TEMPLATE)
    }

    const map = sourcemap(options.src, source, options.dist)

    resolve({
      fragments,
      code: '', // TODO: generate the output code
      map
    })
  })
}

/**
 * Generate the output code source together with the sourcemap
 * @param   { String } name - the name of the riot tag we want to register
 * @param   { String } source - source code of the tag we will need to compile
 * @returns { String } output.code
 * @returns { String } output.map
 * @returns { String } output.fragments
 */
export function parse(name, source, options) {
  return generate(source, options)
    .then(({code, map, fragments}) => {
      return {
        code: `riot.define(${ name }, ${ code })`,
        fragments,
        map
      }
    })
}