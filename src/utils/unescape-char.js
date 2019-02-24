/**
 * Unescape the user escaped chars
 * @param   {string} string - input string
 * @param   {string} char - probably a '{' or anything the user want's to escape
 * @returns {string} cleaned up string
 */
export default function unescapeChar(string, char) {
  return string.replace(RegExp(`\\\\${char}`, 'gm'), char)
}