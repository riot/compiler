import {
  createSelectorProperties,
  findDynamicAttributes,
  getChildrenNodes,
  hasExpressions,
  isEventAttribute,
  isTextNode,
  isValueAttribute
} from '../utils'
import { BINDING_EXPRESSIONS_KEY } from '../constants'
import attributeExpression from '../expressions/attribute'
import {builders} from '../../../utils/build-types'
import eventExpression from '../expressions/event'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'
import textExpression from '../expressions/text'
import valueExpression from '../expressions/value'

function createExpression(sourceNode, sourceFile, sourceCode, childNodeIndex) {
  switch (true) {
  case isTextNode(sourceNode):
    return textExpression(sourceNode, sourceFile, sourceCode, childNodeIndex)
  case isValueAttribute(sourceNode):
    return valueExpression(sourceNode, sourceFile, sourceCode)
  case isEventAttribute(sourceNode):
    return eventExpression(sourceNode, sourceFile, sourceCode)
  default:
    return attributeExpression(sourceNode, sourceFile, sourceCode)
  }
}

/**
 * Create the attribute expressions
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {Array} array containing all the attribute expressions
 */
function createAttributeExpressions(sourceNode, sourceFile, sourceCode) {
  return findDynamicAttributes(sourceNode)
    .map(attribute => createExpression(attribute, sourceFile, sourceCode))
}

/**
 * Create the text node expressions
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {Array} array containing all the text node expressions
 */
function createTextNodeExpressions(sourceNode, sourceFile, sourceCode) {
  const childrenNodes = getChildrenNodes(sourceNode)

  return childrenNodes
    .filter(isTextNode)
    .filter(hasExpressions)
    .map(node => createExpression(
      node,
      sourceFile,
      sourceCode,
      childrenNodes.indexOf(node)
    ))
}

/**
 * Add a simple binding to a riot parser node
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the if attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createSimpleBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  return builders.objectExpression([
    ...createSelectorProperties(selectorAttribute),
    simplePropertyNode(
      BINDING_EXPRESSIONS_KEY,
      builders.arrayExpression([
        ...createTextNodeExpressions(sourceNode, sourceFile, sourceCode),
        ...createAttributeExpressions(sourceNode, sourceFile, sourceCode)
      ])
    )
  ])
}