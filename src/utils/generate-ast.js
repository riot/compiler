// TODO: to remove when https://github.com/acornjs/acorn/pull/834 will be merged
import {Parser} from 'acorn'
import dynamicImport from 'acorn-dynamic-import'
import {parse} from 'recast'

/**
 * Parse a js source to generate the AST
 * @param   {string} source - javascript source
 * @param   {Object} options - parser options
 * @returns {AST} AST tree
 */
export default function generateAST(source, options) {
  return parse(source, {
    parser: {
      parse(source, opts) {
        return Parser.extend(dynamicImport).parse(source, {
          ...opts,
          ecmaVersion: 2019
        })
      }
    },
    ...options
  })
}