import getLineAndColumnByPosition from './get-line-and-column-by-position'

/**
 * Add the offset to the code that must be parsed in order to generate properly the sourcemaps
 * @param {string} input - input string
 * @param {string} source - original source code
 * @param {RiotParser.Node} node - node that we are going to transform
 * @param {number} offset - additional offset needed to skip the line of the <script> and <style> tags
 * @return {string} the input string with the offset properly set
 */
export default function addLineOffset(input, source, node, offset = 0) {
  return `${'\n'.repeat(getLineAndColumnByPosition(source, node.start).line + offset)}${input}`
}