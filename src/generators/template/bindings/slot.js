import {
  BINDING_ATTRIBUTES_KEY,
  BINDING_NAME_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  DEFAULT_SLOT_NAME,
  NAME_ATTRIBUTE,
  SLOT_BINDING_TYPE
} from '../constants'
import {
  createBindingAttributes,
  createSelectorProperties,
  getName,
  getNodeAttributes
} from '../utils'
import {builders} from '../../../utils/build-types'
import {findAttribute} from '../find'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'

/**
 * Transform a RiotParser.Node.Tag of type slot into a slot binding
 * @param   { RiotParser.Node.Tag } sourceNode - slot node
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } a slot binding node
 */
export default function createSlotBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  const slotNameAttribute = findAttribute(NAME_ATTRIBUTE, sourceNode)
  const slotName = slotNameAttribute ? slotNameAttribute.value : DEFAULT_SLOT_NAME

  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(SLOT_BINDING_TYPE),
        false
      )
    ),
    simplePropertyNode(
      BINDING_ATTRIBUTES_KEY,
      createBindingAttributes(
        {
          ...sourceNode,
          // filter the name attribute
          attributes: getNodeAttributes(sourceNode)
            .filter(attribute => getName(attribute) !== NAME_ATTRIBUTE)
        },
        selectorAttribute,
        sourceFile,
        sourceCode
      )
    ),
    simplePropertyNode(
      BINDING_NAME_KEY,
      builders.literal(slotName)
    ),
    ...createSelectorProperties(selectorAttribute)
  ])
}
