'use strict'

/**
 * Brackets support for the node.js version of the riot-compiler
 * @module
 */
var safeRegex = require('./safe-regex.js')

/**
 * Matches valid, multiline JavaScript comments in almost all its forms.
 * @const {RegExp}
 * @static
 */
var R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g

/**
 * Matches single and double quoted strings. Don't care about inner EOLs, so it
 * can be used to match HTML strings, but skips escaped quotes as JavaScript does.
 * Useful to skip strings in values with expressions, e.g. `name={ 'John\'s' }`.
 * @const {RegExp}
 * @static
 */
var R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g

/**
 * The {@link module:brackets.R_STRINGS|R_STRINGS} source combined with sources of
 * regexes matching division operators and literal regexes, for use with the RegExp
 * constructor. The resulting regex captures in `$1` and `$2` a single slash, depending
 * if it matches a division operator ($1) or a literal regex ($2).
 * @const {string}
 * @static
 */
var S_QBLOCKS = R_STRINGS.source + '|' +
  /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
  /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source

/**
 * Hash of regexes for matching JavaScript brackets out of quoted strings and literal
 * regexes. Used by {@link module:brackets.split|split}, these are heavy, but their
 * performance is acceptable.
 * @const {object}
 */
var FINDBRACES = {
  '(': RegExp('([()])|'   + S_QBLOCKS, 'g'),
  '[': RegExp('([[\\]])|' + S_QBLOCKS, 'g'),
  '{': RegExp('([{}])|'   + S_QBLOCKS, 'g')
}

/**
 * The predefined riot brackets
 * @const {string}
 * @default
 */
var DEFAULT = '{ }'

// Pre-made string and regexes for the default brackets
var _pairs = [
  '{', '}',
  '{', '}',
  /{[^}]*}/,
  /\\([{}])/g,
  /\\({)|{/g,
  RegExp('\\\\(})|([[({])|(})|' + S_QBLOCKS, 'g'),
  DEFAULT
]

// Pre-made string and regexes for the last bracket pair
var _cache = []

/*
  Private functions
  ---------------------------------------------------------------------------
*/

/**
 * Rewrite a regex with the default brackets replaced with the custom ones.
 *
 * @param   {RegExp} re - RegExp with the default riot brackets
 * @returns {RegExp} The new regex with the default brackets replaced.
 */
function _rewrite (re) {
  return RegExp(
    re.source.replace(/{/g, _cache[2]).replace(/}/g, _cache[3]), re.global ? 'g' : ''
  )
}

/*
  Exported methods and properties
  ---------------------------------------------------------------------------
*/

module.exports = {
  R_STRINGS: R_STRINGS,
  R_MLCOMMS: R_MLCOMMS,
  S_QBLOCKS: S_QBLOCKS
}

/**
 * Splits the received string in its template text and expression parts using
 * balanced brackets detection to avoid require escaped brackets from the users.
 *
 * _For internal use by the riot-compiler._
 *
 * @param   {string} str - Template source to split, can be one expression
 * @param   {number} _   - unused
 * @param   {Array}  _bp - Info of custom brackets to use
 * @returns {Array} Array of alternating template text and expressions.
 *   If _str_ has one unique expression, returns two elements: `["", expression]`.
 */
module.exports.split = function split (str, _, _bp) {
  /*
    Template text is easy: closing brackets are ignored, all we have to do is find
    the first unescaped bracket. The real work is with the expressions...

    Expressions are not so easy. We can already ignore opening brackets, but finding
    the correct closing bracket is tricky.
    Strings and regexes can contain almost any combination of characters and we
    can't deal with these complexity with our regexes, so let's hide and ignore
    these. From there, all we need is to detect the bracketed parts and skip
    them, as they contains most of the common characters used by riot brackets.
    With that, we have a 90% reliability in the detection, although (hope few) some
    custom brackets still requires to be escaped.
  */
  var
    parts = [],        // holds the resulting parts
    match,             // reused by both outer and nested searches
    isexpr,            // we are in ttext (0) or expression (1)
    start,             // start position of current template or expression
    pos,               // current position (exec() result)
    re = _bp[6]        // start with *updated* regex for opening bracket

  isexpr = start = re.lastIndex = 0       // re is reused, we must reset lastIndex

  while ((match = re.exec(str))) {

    pos = match.index

    if (isexpr) {
      /*
        $1: optional escape character,
        $2: opening js bracket `{[(`,
        $3: closing riot bracket,
        $4 & $5: qblocks
      */
      if (match[2]) {                     // if have a javascript opening bracket,
        re.lastIndex = skipBraces(str, match[2], re.lastIndex)
        continue                          // skip the bracketed block and loop
      }
      if (!match[3]) {                    // if don't have a closing bracket
        continue                          // search again
      }
    }

    /*
      At this point, we expect an _unescaped_ openning bracket in $2 for text,
      or a closing bracket in $3 for expression. $1 may be an backslash.
    */
    if (!match[1]) {                      // ignore it if have an escape char
      unescapeStr(str.slice(start, pos))  // push part, even if empty
      start = re.lastIndex                // next position is the new start
      re = _bp[6 + (isexpr ^= 1)] // switch mode and swap regexp
      re.lastIndex = start                // update the regex pointer
    }
  }

  if (str && start < str.length) {        // push remaining part, if we have one
    unescapeStr(str.slice(start))
  }

  return parts

  /*
    Inner Helpers for _split()
  */

  /**
   * Stores the processed string in the array `parts`.
   * Unescape escaped brackets from expressions.
   *
   * @param {string} s - can be template text or an expression
   */
  function unescapeStr (s) {
    if (isexpr) {
      parts.push(s && s.replace(_bp[5], '$1'))
    } else {
      parts.push(s)
    }
  }

  /**
   * Find the closing JS bracket for the current block in the given string.
   * Skips strings, regexes, and other inner blocks.
   *
   * @param   {string} s  - The searched buffer
   * @param   {string} ch - Opening bracket character
   * @param   {number} ix - Position inside `str` following the opening bracket
   * @returns {number} Position following the closing bracket.
   *
   * @throws Will throw "Unbalanced brackets in ..." if the closing bracket is not found.
   */
  function skipBraces (s, ch, ix) {
    var
      mm,
      rr = FINDBRACES[ch]

    rr.lastIndex = ix
    ix = 1
    while ((mm = rr.exec(s))) {
      if (mm[1] &&
        !(mm[1] === ch ? ++ix : --ix)) break
    }

    if (ix) {
      throw new Error('Unbalanced brackets in ...`' + s.slice(start) + '`?')
    }
    return rr.lastIndex
  }
}

var INVALIDCH = safeRegex(/[@-@<>a-zA-Z0-9'",;\\]/, 'x00', 'x1F')   // invalid characters for brackets
var ESCAPEDCH = /(?=[[\]()*+?.^$|])/g                               // this characters must be escaped

/**
 * Returns an array with information for the given brackets using a cache for the
 * last custom brackets pair required by the caller.
 *
 * _For internal use by the riot-compiler._
 *
 * @param   {string} [pair=DEFAULT] - If used, take this pair as base
 * @returns {Array} Information about the given brackets, in internal format.
 *
 * @throws Will throw "Unsupported brackets ..." if _pair_ contains invalid characters
 *  or is not separated by one space.
 */
module.exports.array = function array (pair) {
  if (!pair || pair === DEFAULT) return _pairs

  if (_cache[8] !== pair) {
    _cache = pair.split(' ')

    if (_cache.length !== 2 || INVALIDCH.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    _cache = _cache.concat(pair.replace(ESCAPEDCH, '\\').split(' '))

    _cache[4] = _rewrite(_cache[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4])
    _cache[5] = _rewrite(/\\({|})/g)
    _cache[6] = _rewrite(_pairs[6])     // for _split()
    _cache[7] = RegExp('\\\\(' + _cache[3] + ')|([[({])|(' + _cache[3] + ')|' + S_QBLOCKS, 'g')
    _cache[8] = pair
  }

  return _cache
}
