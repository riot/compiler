import createSourcemap from '../../utils/create-sourcemap'
import getLineAndColumnByPosition from '../../utils/get-line-and-column-by-position'
import splitStringByEOL from '../../utils/split-string-by-EOL'

/**
 * Generate the sourcemap for the css output
 * @param   { string } source - the entire tag source code
 * @param   { Object } cssNode - css node detected by the parser
 * @param   { string } file - source file path
 * @param   { number } options.line - output line
 * @param   { number } options.column - output column
 * @returns { SourceMapGenerator } a sourcemap instance
 */
export default function generateSourcemap(source, cssNode, file, { line, column }) {
  const sourcemap = createSourcemap({
    file
  })

  // cursor to mark the current parsing position
  // of the generated vs the original code
  const cursor = {
    generatedPosition: column,
    originalPosition: cssNode.start
  }

  splitStringByEOL(cssNode.text).forEach(row => {
    const charsLength = row.length
    const newColumnOffset = cursor.generatedPosition + charsLength

    sourcemap.addMapping({
      source: file,
      name: 'css',
      // the generated code will be always on the same line here
      // we keep adding the chars length to the columns here
      generated: {
        line,
        column: newColumnOffset
      },
      original: getLineAndColumnByPosition(source, newColumnOffset)
    })

    cursor.generatedPosition = newColumnOffset
  })

  return sourcemap
}
