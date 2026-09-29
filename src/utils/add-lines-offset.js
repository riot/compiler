import getLineAndColumnByPosition from './get-line-and-column-by-position.js'

/**
 * Add the offset to the code that must be parsed in order to generate properly the sourcemaps
 * @param {string} input - input string
 * @param {string} source - original source code
 * @param {number} position - position in the source where the first input character should land
 * @returns {string} the input string with the offset properly set
 */
export default function addLineOffset(input, source, position) {
  const { column, line } = getLineAndColumnByPosition(source, position)
  return `${'\n'.repeat(line - 1)}${' '.repeat(column)}${input}`
}
