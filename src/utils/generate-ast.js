import {parse} from 'recast'

/**
 * Parse a js source to generate the AST
 * @param   {string} source - javascript source
 * @param   {Object} options - parser options
 * @returns {AST} AST tree
 */
export default function generateAST(source, options) {
  return parse(source, {
    ...options
  })
}