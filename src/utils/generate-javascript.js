import { parse as customParser } from 'recast/parsers/typescript.js'
import { print } from 'recast'
/**
 * Generate the javascript from an ast source
 * @param   {AST} ast - ast object
 * @param   {Object} options - printer options
 * @returns {Object} code + map
 */
export default function generateJavascript(ast, options) {
  return print(ast, {
    ...options,
    parser: {
      parse: (source, opts) =>
        customParser(source, {
          ...opts,
          ecmaVersion: 'latest',
        }),
    },
    tabWidth: 2,
    wrapColumn: 0,
    quote: 'single',
  })
}
