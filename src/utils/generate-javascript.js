import {print} from 'recast'

/**
 * Generate the javascript from an ast source
 * @param   {AST} ast - ast object
 * @param   {Object} options - printer options
 * @returns {Object} code + map
 */
export default function generateJavascript(ast, options) {
  return print(ast, {
    ...options,
    tabWidth: 2,
    wrapColumn: 0,
    quote: 'single'
  })
}
