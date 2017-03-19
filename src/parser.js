import { SourceMapGenerator } from 'source-map'
import { parse as parseTemplate } from './parsers/template'
import { parse as parseJs } from './parsers/js'
import { parse as parseCss } from './parsers/css'
import { offset } from './util'

// Riot tags fragments regex
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
function fragment(source, regExp) {
  const match = source ? regExp.exec(source) : null
  return match ? {
    // get the type="whathever" attribute
    type: match[1] ? TYPE_ATTR.exec(match[1])[2] : null,
    code: match[2]
  } : null
}

/**
 * Generate the js output from the parsing result
 * @param   { String } name - the component name
 * @param   { String } head - additional javascript that could be added to the component
 * @param   { String } template - the result of the template parsing
 * @param   { String } exports - all the methods exported by the component
 * @param   { String } css - component specific syles
 * @returns { String } object that must be provided to the riot.define method
 */
export function generate(name, head, exports, template, css) {
  return `
    ${ head }
    riot.define(${ name }, {
      ${ exports ? `
          ${ exports }
        ` : ''
      }
      ${
        css ? `
        get css() {
          return \`${ css }\`
        }
        ` : ''
      }
      ${
        template ? `
        render(h) {
          return\`${ template }\`
        }
        ` : ''
      }
    })
  `
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
  return new Promise((resolve, reject) => {
    const fragments = {
      css: fragment(source, STYLE),
      js: fragment(source, SCRIPT),
      template: fragment(source, TEMPLATE)
    }

    const map = options.src && options.dist ? sourcemap(options.src, source, options.dist) : ''
    const js = parseJs(fragments.js, offset(source, '<script'))
    const template = parseTemplate(fragments.template, offset(source, '<template'))
    const css = parseCss(fragments.css, offset(source, '<style'))

    resolve({
      fragments,
      code: generate(name, js.head, js.exports, template.code, css.code),
      map
    })
  })
}