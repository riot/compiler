/**
 * Native String.prototype.trimStart method with fallback to String.prototype.trimLeft
 * Edge doesn't support the first one
 * @param   {string} string - input string
 * @returns {string} trimmed output
 */
export default function trimStart(string) {
  return (string.trimStart || string.trimLeft).apply(string)
}