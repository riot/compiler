import {
  ATTRIBUTE_EXPRESSION_TYPE,
  BINDING_EVALUATE_KEY,
  BINDING_NAME_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES
} from '../constants'
import {nullNode, simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {builders} from '../../../utils/build-types'
import {createAttributeEvaluationFunction} from '../utils'
import {isSpreadAttribute} from '../checks'


/**
 * Create a simple attribute expression
 * @param   {RiotParser.Node.Attr} sourceNode - the custom tag
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} object containing the expression binding keys
 */
export default function createAttributeExpression(sourceNode, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(ATTRIBUTE_EXPRESSION_TYPE),
        false
      )
    ),
    simplePropertyNode(BINDING_NAME_KEY, isSpreadAttribute(sourceNode) ? nullNode() : builders.literal(sourceNode.name)),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode)
    )
  ])
}
