import { SourceNode } from 'source-map'
import getLineAndColumnByPosition from './get-line-and-column-by-position'

/**
 * Create a raw sourcemap for a single riot parser node
 * @param   {RiotParser.Node} node - riot parser node
 * @param   {string} sourceFile - component source file
 * @param   {string} sourceCode - original source code
 * @returns {SourceMapGenerator} source map generated
 */
export default function createNodeSourcemap(node, sourceFile, sourceCode) {
  const {line, column} = getLineAndColumnByPosition(sourceCode, node.start)

  return new SourceNode(null, null, sourceFile, [
    new SourceNode(line, column, sourceFile, sourceCode.slice(node.start, node.end))
  ])
}