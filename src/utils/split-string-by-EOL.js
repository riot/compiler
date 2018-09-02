const LINES_RE = /\r\n?|\n/g

/**
 * Split a string into a rows array generated from its EOL matches
 * @param   { string } string [description]
 * @returns { Array } array containing all the string rows
 */
export default function splitStringByEOL(string) {
  return string.split(LINES_RE)
}