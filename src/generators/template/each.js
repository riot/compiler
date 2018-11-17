import {
  BINDING_CONDITION_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TEMPLATE_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  EACH_BINDING_TYPE,
  EACH_DIRECTIVE,
  IF_DIRECTIVE
} from './constants'
import {findAttribute, getEachExpressionProperties, toScopedFunction} from './utils'
import build from './builder'
import {builders} from '../../utils/build-types'
import {isCustom} from 'dom-nodes'
import tag from './tag'

export function createEachBinding(node, sourceFile, sourceCode) {
  const ifAttribute = findAttribute(node, IF_DIRECTIVE)
  const eachAttribute = findAttribute(node, EACH_DIRECTIVE)
  const mightBeARiotComponent = isCustom(node.name)

  return builders.objectExpression([
    builders.property(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(EACH_BINDING_TYPE),
        false
      )
    ),
    builders.property(BINDING_SELECTOR_KEY, builders.litteral(node.selector)),
    builders.property(BINDING_CONDITION_KEY,
      ifAttribute ? toScopedFunction(ifAttribute, sourceFile, sourceCode) : builders.literal(),
    ),
    builders.property(BINDING_TEMPLATE_KEY, mightBeARiotComponent ?
      tag(node, sourceCode, sourceCode) :
      build(node, sourceFile, sourceCode)
    ),
    ...getEachExpressionProperties(eachAttribute.expressions[0])
  ])
}