import {
  BINDING_CHILD_NODE_INDEX_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES,
  TEXT_EXPRESSION_TYPE
} from '../constants'
import {
  mergeNodeExpressions,
  toScopedFunction
} from '../utils'
import {builders} from '../../../utils/build-types'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'

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
      toScopedFunction({
        start: sourceNode.start,
        end: sourceNode.end,
        text: mergeNodeExpressions(sourceNode)
      }, sourceFile, sourceCode)
    )
  ])
}