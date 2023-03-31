import {
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  VALUE_EXPRESSION_TYPE,
} from '../constants.mjs'
import { builders } from '../../../utils/build-types.mjs'
import { createAttributeEvaluationFunction } from '../utils.mjs'
import { simplePropertyNode } from '../../../utils/custom-ast-nodes.mjs'

export default function createValueExpression(
  sourceNode,
  sourceFile,
  sourceCode,
) {
  return builders.objectExpression([
    simplePropertyNode(
      BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(VALUE_EXPRESSION_TYPE),
        false,
      ),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode),
    ),
  ])
}
