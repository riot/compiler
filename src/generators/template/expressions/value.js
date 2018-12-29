import {
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  VALUE_EXPRESSION_TYPE
} from '../constants'
import {builders} from '../../../utils/build-types'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {toScopedFunction} from '../utils'

export default function createValueExpression(sourceNode, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(VALUE_EXPRESSION_TYPE),
        false
      ),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      toScopedFunction(sourceNode.expressions[0], sourceFile, sourceCode)
    )
  ])
}