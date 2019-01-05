import {
  BINDING_CONDITION_KEY,
  BINDING_GET_KEY_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  EACH_BINDING_TYPE
} from '../constants'
import {
  cloneNodeWithoutSelectorAttribute,
  createRootNode,
  createSelectorProperties,
  createTemplateProperty,
  findEachAttribute,
  findIfAttribute,
  findKeyAttribute,
  getAttributeExpression,
  getEachExpressionProperties,
  isCustomNode,
  toScopedFunction
} from '../utils'

import {nullNode, simplePropertyNode} from '../../../utils/custom-ast-nodes'
import build from '../builder'
import {builders} from '../../../utils/build-types'
import compose from '../../../utils/compose'
import tagBinding from './tag'


/**
 * Transform a RiotParser.Node.Tag into an each binding
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the each attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createEachBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  const [ifAttribute, eachAttribute, keyAttribute] = [
    findIfAttribute,
    findEachAttribute,
    findKeyAttribute
  ].map(f => f(sourceNode))
  const mightBeARiotComponent = isCustomNode(sourceNode)
  const attributeOrNull = attribute => attribute ? toScopedFunction(getAttributeExpression(attribute), sourceFile, sourceCode) : nullNode()

  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(EACH_BINDING_TYPE),
        false
      ),
    ),
    simplePropertyNode(BINDING_GET_KEY_KEY, attributeOrNull(keyAttribute)),
    simplePropertyNode(BINDING_CONDITION_KEY, attributeOrNull(ifAttribute)),
    createTemplateProperty(mightBeARiotComponent ?
      [null, [
        tagBinding(
          cloneNodeWithoutSelectorAttribute(sourceNode),
          null,
          sourceCode,
          sourceCode
        )]
      ] :
      build(createRootNode(sourceNode), sourceCode, sourceCode)
    ),
    ...createSelectorProperties(selectorAttribute),
    ...compose(getEachExpressionProperties, getAttributeExpression)(eachAttribute)
  ])
}