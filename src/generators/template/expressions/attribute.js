import {
  ATTRIBUTE_EXPRESSION_TYPE,
  BINDING_EVALUATE_KEY,
  BINDING_IS_BOOLEAN_ATTRIBUTE,
  BINDING_NAME_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  IS_BOOLEAN_ATTRIBUTE,
  IS_CUSTOM_NODE,
} from '../constants.js'
import {
  nullNode,
  simplePropertyNode,
} from '../../../utils/custom-ast-nodes.js'
import { builders } from '../../../utils/build-types.js'
import { createAttributeEvaluationFunction } from '../utils.js'
/**
 * Create a simple attribute expression
 * @param   {RiotParser.Node.Attr} sourceNode - the custom tag
 * @param   {RiotParser.Node} parentNode - the html node that has received the attribute expression
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} object containing the expression binding keys
 */
export default function createAttributeExpression(
  sourceNode,
  parentNode,
  sourceFile,
  sourceCode,
) {
  const isSpread = isSpreadAttribute(sourceNode)

  return builders.objectExpression([
    simplePropertyNode(
      BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(ATTRIBUTE_EXPRESSION_TYPE),
        false,
      ),
    ),
    simplePropertyNode(
      BINDING_IS_BOOLEAN_ATTRIBUTE,
      builders.literal(
        // the hidden attribute is always a boolean and can be applied to any DOM node
        sourceNode.name === 'hidden' ||
          // Custom nodes can't handle boolean attrs
          // Riot.js will handle the bool attrs logic only on native html tags
          (!parentNode[IS_CUSTOM_NODE] &&
            !isRootNode(parentNode) &&
            !isSpread &&
            !!sourceNode[IS_BOOLEAN_ATTRIBUTE]),
      ),
    ),
    simplePropertyNode(
      BINDING_NAME_KEY,
      isSpread ? nullNode() : builders.literal(sourceNode.name),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode),
    ),
  ])
}

import { isRootNode, isSpreadAttribute } from '../checks.js'
