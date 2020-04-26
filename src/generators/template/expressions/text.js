import {
  BINDING_CHILD_NODE_INDEX_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  TEXT_EXPRESSION_TYPE
} from '../constants'
import {createArrayString, transformExpression, wrapASTInFunctionWithScope} from '../utils'
import {nullNode,simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {builders} from '../../../utils/build-types'
import encodeHTMLEntities from '../../../utils/html-entities/encode'
import {isCommentString} from '../checks'
import {isLiteral} from '../../../utils/ast-nodes-checks'
import trimEnd from '../../../utils/trim-end'
import trimStart from '../../../utils/trim-start'
import unescapeChar from '../../../utils/unescape-char'

/**
 * Generate the pure immutable string chunks from a RiotParser.Node.Text
 * @param   {RiotParser.Node.Text} node - riot parser text node
 * @param   {string} sourceCode sourceCode - source code
 * @returns {Array} array containing the immutable string chunks
 */
function generateLiteralStringChunksFromNode(node, sourceCode) {
  return node.expressions.reduce((chunks, expression, index) => {
    const start = index ? node.expressions[index - 1].end : node.start
    const string = encodeHTMLEntities(
      sourceCode.substring(start, expression.start)
    )

    // trimStart the first string
    chunks.push(index === 0 ? trimStart(string) : string)

    // add the tail to the string
    if (index === node.expressions.length - 1)
      chunks.push(
        encodeHTMLEntities(
          trimEnd(sourceCode.substring(expression.end, node.end))
        )
      )

    return chunks
  }, [])
    // comments are not supported here
    .filter(str => !isCommentString(str))
    .map(str => node.unescape ? unescapeChar(str, node.unescape) : str)
}

/**
 * Simple bindings might contain multiple expressions like for example: "{foo} and {bar}"
 * This helper aims to merge them in a template literal if it's necessary
 * @param   {RiotParser.Node} node - riot parser node
 * @param   {string} sourceFile - original tag file
 * @param   {string} sourceCode - original tag source code
 * @returns { Object } a template literal expression object
 */
export function mergeNodeExpressions(node, sourceFile, sourceCode) {
  if (node.parts.length === 1)
    return transformExpression(node.expressions[0], sourceFile, sourceCode)

  const pureStringChunks = generateLiteralStringChunksFromNode(node, sourceCode)
  const stringsArray = pureStringChunks.reduce((acc, str, index) => {
    const expr = node.expressions[index]

    return [
      ...acc,
      builders.literal(str),
      expr ? transformExpression(expr, sourceFile, sourceCode) : nullNode()
    ]
  }, [])
    // filter the empty literal expressions
    .filter(expr => !isLiteral(expr) || expr.value)

  return createArrayString(stringsArray)
}

/**
 * Create a text expression
 * @param   {RiotParser.Node.Text} sourceNode - text node to parse
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {number} childNodeIndex - position of the child text node in its parent children nodes
 * @returns {AST.Node} object containing the expression binding keys
 */
export default function createTextExpression(sourceNode, sourceFile, sourceCode, childNodeIndex) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(TEXT_EXPRESSION_TYPE),
        false
      )
    ),
    simplePropertyNode(
      BINDING_CHILD_NODE_INDEX_KEY,
      builders.literal(childNodeIndex)
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      wrapASTInFunctionWithScope(
        mergeNodeExpressions(sourceNode, sourceFile, sourceCode)
      )
    )
  ])
}