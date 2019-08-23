import {isEventAttribute, isProgressNode, isTextNode, isValueAttribute} from '../checks'
import attributeExpression from './attribute'
import eventExpression from './event'
import {findDynamicAttributes} from '../find'
import {hasValueAttribute} from 'dom-nodes'
import textExpression from './text'
import valueExpression from './value'

export function createExpression(sourceNode, sourceFile, sourceCode, childNodeIndex, parentNode) {
  switch (true) {
  case isTextNode(sourceNode):
    return textExpression(sourceNode, sourceFile, sourceCode, childNodeIndex)
  // progress nodes value attributes will be rendered as attributes
  // see https://github.com/riot/compiler/issues/122
  case isValueAttribute(sourceNode) && hasValueAttribute(parentNode.name) && !isProgressNode(parentNode):
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
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {Array} array containing all the attribute expressions
 */
export function createAttributeExpressions(sourceNode, sourceFile, sourceCode) {
  return findDynamicAttributes(sourceNode)
    .map(attribute => createExpression(attribute, sourceFile, sourceCode, 0, sourceNode))
}
