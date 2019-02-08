import splitStringByEOL from './split-string-by-EOL'

/**
 * Get the line and the column of a source text based on its position in the string
 * @param   { string } string - target string
 * @param   { number } position - target position
 * @returns { Object } object containing the source text line and column
 */
export default function getLineAndColumnByPosition(string, position) {
  const lines = splitStringByEOL(string.slice(0, position))

  return {
    line: lines.length,
    column: lines[lines.length - 1].length
  }
}
