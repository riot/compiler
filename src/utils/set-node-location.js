import getLineAndColumnByPosition from './get-line-and-column-by-position'
import {types} from './build-types'

/**
 * Set manually the node location
 * @param {ASTNode} ast - generated ast node
 * @param {RiotParser.Node} node - node parsed by the riot parser
 * @param {string} source - source code
 * @returns {ASTNode} enhanced node
 */
export default function setNodeLocation(ast, node, source) {
  const {line, column} = getLineAndColumnByPosition(source, node.start)

  types.eachField(ast, (n, value) => {
    if (value && value.loc) {
      value.loc.start = {
        ...value.loc.start,
        line: value.loc.start.line + line,
        column: value.loc.start.column + column
      }

      value.loc.end = {
        ...value.loc.end,
        line: value.loc.end.line + line,
        column: value.loc.end.column + column
      }

      setNodeLocation(value, node, source)
    }
  })

  return ast
}