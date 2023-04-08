import {
  BINDING_EVALUATE_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  IF_BINDING_TYPE,
} from '../constants.js'
import {
  createSelectorProperties,
  createTemplateProperty,
  toScopedFunction,
} from '../utils.js'
import { builders } from '../../../utils/build-types.js'
import { createNestedBindings } from '../builder.js'
import { findIfAttribute } from '../find.js'
import { simplePropertyNode } from '../../../utils/custom-ast-nodes.js'

/**
 * Transform a RiotParser.Node.Tag into an if binding
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the if attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an if binding node
 */
export default function createIfBinding(
  sourceNode,
  selectorAttribute,
  sourceFile,
  sourceCode,
) {
  const ifAttribute = findIfAttribute(sourceNode)

  return builders.objectExpression([
    simplePropertyNode(
      BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(IF_BINDING_TYPE),
        false,
      ),
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      toScopedFunction(ifAttribute.expressions[0], sourceFile, sourceCode),
    ),
    ...createSelectorProperties(selectorAttribute),
    createTemplateProperty(
      createNestedBindings(
        sourceNode,
        sourceFile,
        sourceCode,
        selectorAttribute,
      ),
    ),
  ])
}
