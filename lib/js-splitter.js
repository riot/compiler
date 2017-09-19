
var skipRegex = require('skip-regex')

var S_SQ_STR = /'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/.source

var S_R_SRC1 = [
  /\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\//.source,
  '//.*',
  S_SQ_STR,
  S_SQ_STR.replace(/'/g, '"'),
  '([/`])'
].join('|')

var S_R_SRC2 = `${S_R_SRC1.slice(0, -2)}{}])`

/**
 * Simple ES6 Template Literal parser, it searches the next back-quote that
 * signals the end of the ES6TL or the `${` sequence that starts a JS expression,
 * skipping any escaped character.
 *
 * @param   {string} code  - Whole code
 * @param   {number} start - The start position of the template
 * @param   {number} stack - To save nested ES6 TL count
 * @returns {number}         The end of the string (-1 if not found)
 */
function skipES6str (code, start, stack) {

  var re = /[`$\\]/g

  re.lastIndex = start
  while (re.exec(code)) {
    var end = re.lastIndex
    var c = code[end - 1]

    if (c === '`') {
      return end
    }
    if (c === '$' && code[end] === '{') {
      stack.push('`', '}')
      return end + 1
    }
    re.lastIndex++
  }

  throw new Error('Unclosed ES6 template')
}

/**
 * Parses the code string searching the end of the expression.
 * @param   {string} code - Buffer to parse
 * @param   {number} [start=0]  - Start position of the parsing
 * @returns {Array}  Expression's end (after the closing brace) or -1 if it is not an expr.
 * @class
 */
function jsSplitter (code, start) {

  var re1 = new RegExp(S_R_SRC1, 'g')
  var re2

  var offset = start | 0
  var result = [[]]
  var stack = []
  var re = re1

  var lastPos = re.lastIndex = offset
  var str, ch, idx, end, match

  while ((match = re.exec(code))) {
    idx = match.index
    end = re.lastIndex
    str = ''
    ch = match[1]

    if (ch) {

      if (ch === '{') {
        stack.push('}')

      } else if (ch === '}') {
        if (stack.pop() !== ch) {
          throw new Error("Unexpected '}'")

        } else if (stack[stack.length - 1] === '`') {
          ch = stack.pop()
        }

      } else if (ch === '/') {
        end = skipRegex(code, idx)

        if (end > idx + 1) {
          str = code.slice(idx, end)
        }
      }

      if (ch === '`') {
        end = skipES6str(code, end, stack)
        str = code.slice(idx, end)

        if (stack.length) {
          re = re2 || (re2 = new RegExp(S_R_SRC2, 'g'))
        } else {
          re = re1
        }
      }

    } else {

      str = match[0]

      if (str[0] === '/') {
        str = str[1] === '*' ? ' ' : ''
        code = code.slice(offset, idx) + str + code.slice(end)
        end = idx + str.length
        str = ''

      } else if (str.length === 2) {
        str = ''
      }
    }

    if (str) {
      result[0].push(code.slice(lastPos, idx))
      result.push(str)
      lastPos = end
    }

    re.lastIndex = end
  }

  result[0].push(code.slice(lastPos))

  return result
}

module.exports = jsSplitter
