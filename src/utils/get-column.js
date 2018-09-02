/**
 * Count spaces before first character of a string
 * @param   { string } string - target string
 * @returns { number } amount of spaces before the first char
 */
export default function getColum(string) {
  const spacesAmount = string.search(/\S/)
  return spacesAmount > 0 ? spacesAmount : 0
}