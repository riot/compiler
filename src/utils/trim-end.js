/**
 * Native String.prototype.trimEnd method with fallback to String.prototype.trimRight
 * Edge doesn't support the first one
 * @param   {string} string - input string
 * @returns {string} trimmed output
 */
export default function trimEnd(string) {
  return (string.trimEnd || string.trimRight).apply(string)
}