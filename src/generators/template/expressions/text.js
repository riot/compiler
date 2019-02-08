import {
  BINDING_CHILD_NODE_INDEX_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  TEXT_EXPRESSION_TYPE
} from '../constants'
import {mergeNodeExpressions,wrapASTInFunctionWithScope} from '../utils'
import {builders} from '../../../utils/build-types'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'

/**
 * Create a text expression
 * @param   {RiotParser.Node.Text} sourceNode - text node to parse
 * @param   {stiring} sourceFile - source file path
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
      ),
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