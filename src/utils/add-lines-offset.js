import getLineAndColumnByPosition from './get-line-and-column-by-position'

/**
 * Add the offset to the code that must be parsed in order to generate properly the sourcemaps
 * @param {string} input - input string
 * @param {string} source - original source code
 * @param {RiotParser.Node} node - node that we are going to transform
 * @return {string} the input string with the offset properly set
 */
export default function addLineOffset(input, source, node) {
  const {column, line} = getLineAndColumnByPosition(source, node.start)
  return `${'\n'.repeat(line - 1)}${' '.repeat(column + 1)}${input}`
}