/**
 * Replace a text chunk in a range
 * @param {string} originalString - the text we need to patch
 * @param {number} start - the start offset where the string should be replaced
 * @param {number} end - the end where the string replacement should finish
 * @param {string} replacement - the string we need to insert
 * @return {string} the original text patched with the replacement string
 */
export default function replaceInRange(
  originalString,
  start,
  end,
  replacement,
) {
  return `${originalString.substring(0, start)}${replacement}${originalString.substring(end)}`
}
