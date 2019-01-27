import createSourcemap from './create-sourcemap'
import getLineAndColumnByPosition from './get-line-and-column-by-position'

/**
 * Create a raw sourcemap for a single riot parser node
 * @param   {RiotParser.Node} node - riot parser node
 * @param   {string} sourceFile - component source file
 * @param   {string} sourceCode - original source code
 * @returns {SourceMapGenerator} source map generated
 */
export default function createNodeSourcemap(node, sourceFile, sourceCode) {
  const sourcemap = createSourcemap({ file: sourceFile })

  ;[node.start, node.end].forEach(position => {
    const location = getLineAndColumnByPosition(sourceCode, position)

    sourcemap.addMapping({
      source: sourceFile,
      generated: location,
      original: location
    })
  })

  return sourcemap
}