const ATTRIBUTE_TYPE_NAME = 'type'

/**
 * Get the type attribute from a node generated by the riot parser
 * @param   { Object} sourceNode - riot parser node
 * @returns { string|null } a valid type to identify the preprocessor to use or nothing
 */
export default function getPreprocessorTypeByAttribute(sourceNode) {
  const typeAttribute = sourceNode.attributes
    ? sourceNode.attributes.find(
        (attribute) => attribute.name === ATTRIBUTE_TYPE_NAME,
      )
    : null

  return typeAttribute ? normalize(typeAttribute.value) : null
}

/**
 * Remove the noise in case a user has defined the preprocessor type='text/scss'
 * @param   { string } value - input string
 * @returns { string } normalized string
 */
function normalize(value) {
  return value.replace('text/', '')
}