/**
 * Get the rows offset of a target string from a source text file
 * @param   { String } source - source string to test
 * @param   { String } target - string we want to detect
 * @returns { Number } offset in rows of the target string
 */
export function offset(source, target) {
  return source.substring(0, source.indexOf(target) ).split('\n').length
}