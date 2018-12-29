import {
  ATTRIBUTE_EXPRESSION_TYPE,
  BINDING_EVALUATE_KEY,
  BINDING_NAME_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES
} from '../constants'
import {builders} from '../../../utils/build-types'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {toScopedFunction} from '../utils'

export default function createAttributeExpression(sourceNode, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(ATTRIBUTE_EXPRESSION_TYPE),
        false
      ),
    ),
    simplePropertyNode(BINDING_NAME_KEY, builders.literal(sourceNode.name)),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      toScopedFunction(sourceNode.expressions[0], sourceFile, sourceCode)
    )
  ])
}