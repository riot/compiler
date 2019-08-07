/**
 * In some cases like on custom tags we need to normalize the attribute values
 * see also https://github.com/riot/compiler/issues/124
 * @param   {RiotParser.Attr} sourceNode - riot parser node
 * @returns {string} value of the attribute expression
 */
export default function normalizeAttributeExpressionValue(sourceNode) {
  const expressions = sourceNode.expressions

  return expressions ? expressions[0] : sourceNode.value
}