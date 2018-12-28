
import {isEventAttribute, isTextNode, isValueAttribute} from '../utils'
import attributeExpression from '../expressions/attribute'
import eventExpression from '../expressions/event'
import textExpression from '../expressions/text'
import valueExpression from '../expressions/value'

/**
 * Add a simple binding to a riot parser node
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the if attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @param   { number } childNodeIndex - index to identify the position of the current node in the parent childNodes list
 * @returns { AST.Node } an each binding node
 */
export default function createTagBinding(sourceNode, selectorAttribute, sourceFile, sourceCode, childNodeIndex) {
  switch (true) {
  case isTextNode(sourceNode):
    return textExpression(sourceNode, selectorAttribute, sourceFile, sourceCode, childNodeIndex)
  case isValueAttribute(sourceNode):
    return valueExpression(sourceNode, selectorAttribute, sourceFile, sourceCode)
  case isEventAttribute(sourceNode):
    return eventExpression(sourceNode, selectorAttribute, sourceFile, sourceCode)
  default:
    return attributeExpression(sourceNode, selectorAttribute, sourceFile, sourceCode)
  }
}