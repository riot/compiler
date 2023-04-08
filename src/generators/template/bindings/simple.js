import {
  createAttributeExpressions,
  createExpression,
} from '../expressions/index.js'
import { createSelectorProperties, getChildrenNodes } from '../utils.js'
import {
  hasExpressions,
  isRemovableNode,
  isRootNode,
  isTextNode,
} from '../checks.js'
import { BINDING_EXPRESSIONS_KEY } from '../constants.js'
import { builders } from '../../../utils/build-types.js'
import { simplePropertyNode } from '../../../utils/custom-ast-nodes.js'

/**
 * Create the text node expressions
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {Array} array containing all the text node expressions
 */
function createTextNodeExpressions(sourceNode, sourceFile, sourceCode) {
  const childrenNodes = getChildrenNodes(sourceNode)

  return childrenNodes
    .filter(isTextNode)
    .filter(hasExpressions)
    .map((node) =>
      createExpression(
        node,
        sourceFile,
        sourceCode,
        childrenNodes.indexOf(node),
        sourceNode,
      ),
    )
}

/**
 * Add a simple binding to a riot parser node
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the if attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createSimpleBinding(
  sourceNode,
  selectorAttribute,
  sourceFile,
  sourceCode,
) {
  return builders.objectExpression([
    // root or removable nodes do not need selectors
    ...(isRemovableNode(sourceNode) || isRootNode(sourceNode)
      ? []
      : createSelectorProperties(selectorAttribute)),
    simplePropertyNode(
      BINDING_EXPRESSIONS_KEY,
      builders.arrayExpression([
        ...createTextNodeExpressions(sourceNode, sourceFile, sourceCode),
        ...createAttributeExpressions(sourceNode, sourceFile, sourceCode),
      ]),
    ),
  ])
}
