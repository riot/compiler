import {
  BINDING_ATTRIBUTES_KEY,
  BINDING_BINDINGS_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_GET_COMPONENT_KEY,
  BINDING_HTML_KEY,
  BINDING_ID_KEY,
  BINDING_SLOTS_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  GET_COMPONENT_FN,
  SLOT_ATTRIBUTE,
  TAG_BINDING_TYPE
} from '../constants'
import {
  createBindingAttributes,
  createNestedRootNode,
  createSelectorProperties,
  getChildrenNodes,
  getCustomNodeNameAsExpression,
  getNodeAttributes,
  toScopedFunction
} from '../utils'
import build from '../builder'
import {builders} from '../../../utils/build-types'
import compose from 'cumpa'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'

/**
 * Find the slots in the current component and group them under the same id
 * @param   {RiotParser.Node.Tag} sourceNode - the custom tag
 * @returns {Object} object containing all the slots grouped by name
 */
function groupSlots(sourceNode) {
  return getChildrenNodes(sourceNode).reduce((acc, node) => {
    const slotAttribute = findSlotAttribute(node)

    if (slotAttribute) {
      acc[slotAttribute.value] = node
    } else {
      acc.default = createNestedRootNode({
        nodes: [...getChildrenNodes(acc.default), node]
      })
    }

    return acc
  }, {
    default: null
  })
}

/**
 * Create the slot entity to pass to the riot-dom bindings
 * @param   {string} id - slot id
 * @param   {RiotParser.Node.Tag} sourceNode - slot root node
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} ast node containing the slot object properties
 */
function buildSlot(id, sourceNode, sourceFile, sourceCode) {
  const cloneNode = {
    ...sourceNode,
    attributes: getNodeAttributes(sourceNode)
  }
  const [html, bindings] = build(cloneNode, sourceFile, sourceCode)

  return builders.objectExpression([
    simplePropertyNode(BINDING_ID_KEY, builders.literal(id)),
    simplePropertyNode(BINDING_HTML_KEY, builders.literal(html)),
    simplePropertyNode(BINDING_BINDINGS_KEY, builders.arrayExpression(bindings))
  ])
}

/**
 * Create the AST array containing the slots
 * @param   { RiotParser.Node.Tag } sourceNode - the custom tag
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns {AST.ArrayExpression} array containing the attributes to bind
 */
function createSlotsArray(sourceNode, sourceFile, sourceCode) {
  return builders.arrayExpression([
    ...compose(
      slots => slots.map(([key, value]) => buildSlot(key, value, sourceFile, sourceCode)),
      slots => slots.filter(([, value]) => value),
      Object.entries,
      groupSlots
    )(sourceNode)
  ])
}

/**
 * Find the slot attribute if it exists
 * @param   {RiotParser.Node.Tag} sourceNode - the custom tag
 * @returns {RiotParser.Node.Attr|undefined} the slot attribute found
 */
function findSlotAttribute(sourceNode) {
  return getNodeAttributes(sourceNode).find(attribute => attribute.name === SLOT_ATTRIBUTE)
}

/**
 * Transform a RiotParser.Node.Tag into a tag binding
 * @param   { RiotParser.Node.Tag } sourceNode - the custom tag
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } tag binding node
 */
export default function createTagBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(TAG_BINDING_TYPE),
        false
      )
    ),
    simplePropertyNode(BINDING_GET_COMPONENT_KEY, builders.identifier(GET_COMPONENT_FN)),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      toScopedFunction(getCustomNodeNameAsExpression(sourceNode), sourceFile, sourceCode)
    ),
    simplePropertyNode(BINDING_SLOTS_KEY, createSlotsArray(sourceNode, sourceFile, sourceCode)),
    simplePropertyNode(
      BINDING_ATTRIBUTES_KEY,
      createBindingAttributes(sourceNode, selectorAttribute, sourceFile, sourceCode)
    ),
    ...createSelectorProperties(selectorAttribute)
  ])
}
