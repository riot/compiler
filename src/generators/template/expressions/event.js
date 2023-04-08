import {
  BINDING_EVALUATE_KEY,
  BINDING_NAME_KEY,
  BINDING_TYPE_KEY,
  EVENT_EXPRESSION_TYPE,
  EXPRESSION_TYPES,
} from '../constants.js'
import { builders } from '../../../utils/build-types.js'
import { createAttributeEvaluationFunction } from '../utils.js'
import { simplePropertyNode } from '../../../utils/custom-ast-nodes.js'

/**
 * Create a simple event expression
 * @param   {RiotParser.Node.Attr} sourceNode - attribute containing the event handlers
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} object containing the expression binding keys
 */
export default function createEventExpression(
  sourceNode,
  sourceFile,
  sourceCode,
) {
  return builders.objectExpression([
    simplePropertyNode(
      BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(EVENT_EXPRESSION_TYPE),
        false,
      ),
    ),
    simplePropertyNode(BINDING_NAME_KEY, builders.literal(sourceNode.name)),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode),
    ),
  ])
}
