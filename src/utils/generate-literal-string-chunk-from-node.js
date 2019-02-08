/**
 * Generate the pure immutable string chunks from a RiotParser.Node.Text
 * @param   {RiotParser.Node.Text} node - riot parser text node
 * @param   {string} sourceCode sourceCode - source code
 * @returns {Array} array containing the immutable string chunks
 */
export default function generateLiteralStringChunksFromNode(node, sourceCode) {
  return node.expressions.reduce((chunks, expression, index) => {
    const start = index ? node.expressions[index - 1].end : node.start

    chunks.push(sourceCode.substring(start, expression.start))

    // add the tail to the string
    if (index === node.expressions.length - 1)
      chunks.push(sourceCode.substring(expression.end, node.end))

    return chunks
  }, [])
}