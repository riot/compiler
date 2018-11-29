import {
  BINDING_EVALUATE_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  IF_BINDING_TYPE,
  IF_DIRECTIVE
} from './constants'
import {
  createSelectorProperties,
  createTemplateProperty,
  findAttribute,
  toScopedFunction
} from './utils'
import build from './builder'
import {builders} from '../../utils/build-types'
import {isCustom} from 'dom-nodes'
import {simplePropertyNode} from '../../utils/custom-ast-nodes'
import tag from './tag'


/**
 * Transform a RiotParser.Node.Tag into an if binding
 * @param   { RiotParser.Node.Tag } node - tag containing the each attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createIFBinding(node, selectorAttribute, sourceFile, sourceCode) {
  const ifAttribute = findAttribute(node, IF_DIRECTIVE)
  const mightBeARiotComponent = isCustom(node.name)

  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(IF_BINDING_TYPE),
        false
      ),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      toScopedFunction(ifAttribute.expressions[0], sourceFile, sourceCode)
    ),
    ...createSelectorProperties(selectorAttribute),
    createTemplateProperty(
      (mightBeARiotComponent ? tag : build)(node, sourceCode, sourceCode)
    )
  ])
}