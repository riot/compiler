import {
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  REF_EXPRESSION_TYPE,
} from '../constants.js'
import { builders } from '../../../utils/build-types.js'
import { createAttributeEvaluationFunction } from '../utils.js'
import { simplePropertyNode } from '../../../utils/custom-ast-nodes.js'

export default function createRefExpression(
  sourceNode,
  sourceFile,
  sourceCode,
) {
  return builders.objectExpression([
    simplePropertyNode(
      BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(REF_EXPRESSION_TYPE),
        false,
      ),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode),
    ),
  ])
}
