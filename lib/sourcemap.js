var SourceMapGenerator = require('source-map').SourceMapGenerator
var stringSimilarity = require('string-similarity')

var LINES_RE = /[\r\n]/
var INDENTATION_RE = /^\s*/

/**
 * Find the source code using Levenshtein algorithm.
 * At moment riot doesn't use a real parser so that's the easiest solution to create sourcemaps
 * @param   {string} sourceLine - original source code line
 * @param   {array} outputLines - output lines
 * @returns {object} sourcemap position
 */
function findSource(sourceLine, outputLines) {
  // figure out where this line could be located in the source code
  var bestMatch = stringSimilarity.findBestMatch(sourceLine, outputLines).bestMatch
  // find the index of the line matched
  var index = outputLines.indexOf(bestMatch.target)

  // figure out the column
  var column = bestMatch.target.indexOf(sourceLine)

  return {
    line: ++index,
    column: (column > -1 ? column : getIndentation(bestMatch.target)) + 1
  }
}

/**
 * Return the indentation amount of a line containing code
 * @param   {string} code - string containing code
 * @returns {number} amount of indentation
 */
function getIndentation(code) {
  return code.match(INDENTATION_RE)[0].length
}

/**
 * Remove the indentation from the source code
 * @param   {string} code - target code
 * @returns {string} code without indentation
 */
function cleanLine(code) {
  return code.replace(INDENTATION_RE, '').trim()
}

/**
 * Generate the sourcemap
 * @param   {object} opts - object containing the source/generated code and the file path
 * @returns {SourceMapGenerator} - SourceMapGenerator instance
 */
function generate(opts) {
  var map = new SourceMapGenerator({
    file: opts.file
  })

  // set explicitely the source contents
  map.setSourceContent(opts.file, opts.source)

  var outputLines = opts.generated.split(LINES_RE).map(cleanLine).filter(l => l.length)

  opts.source.split(LINES_RE).forEach(function(line, index) {
    // skip empty lines
    if (!cleanLine(line).length) return
    map.addMapping({
      source: opts.file,
      original:{
        line: ++index,
        column: getIndentation(line)
      },
      generated: findSource(line, outputLines)
    })
  })

  return map
}

/**
 * Generate inline sourcemap comment
 * @param   {SourceMapGenerator} map - SourceMapGenerator instance
 * @returns {string} - sourcemap comment string
 */
function toInlineComment(map) {
  const comment = '//# sourceMappingURL=data:application/json;charset=utf-8;base64,'
  return `${comment}${new Buffer(map.toString()).toString('base64')}`
}

// generate inline comment from sourcemaps
generate.toInlineComment = toInlineComment

module.exports = generate