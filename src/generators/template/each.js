import {
  BINDING_CONDITION_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  EACH_BINDING_TYPE,
  EACH_DIRECTIVE,
  IF_DIRECTIVE
} from './constants'
import {createTemplateProperty, findAttribute, getEachExpressionProperties, toScopedFunction} from './utils'
import {nullNode, simplePropertyNode} from '../../utils/custom-ast-nodes'
import build from './builder'
import {builders} from '../../utils/build-types'
import {isCustom} from 'dom-nodes'
import tag from './tag'

export default function createEachBinding(node, selector, sourceFile, sourceCode) {
  const ifAttribute = findAttribute(node, IF_DIRECTIVE)
  const eachAttribute = findAttribute(node, EACH_DIRECTIVE)
  const mightBeARiotComponent = isCustom(node.name)

  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(EACH_BINDING_TYPE),
        false
      ),
    ),
    simplePropertyNode(BINDING_SELECTOR_KEY, builders.literal(selector)),
    simplePropertyNode(BINDING_CONDITION_KEY,
      ifAttribute ? toScopedFunction(ifAttribute, sourceFile, sourceCode) : nullNode(),
    ),
    createTemplateProperty(
      (mightBeARiotComponent ? tag : build)(node, sourceCode, sourceCode)
    ),
    ...getEachExpressionProperties(eachAttribute.expressions[0])
  ])
}