
/*#norm:
  Shared regexps for JavaScript source code

  STRINGS - Single or double quoted strings, including empty ones. Supports '\' for line continuation.
  DIVISOR - Matches a division operator for non-regexp slash identification (captures the slash).
  REGEXPS - Literal regexps (captures the final slash).
  MLCOMMS - Multiline comments in almost all forms.
  S_QBSRC - Source of STRINGS + DIVISOR + REGEXPS, simplifies construction of other regexps.
*/

function regExp(restr, opts) {
  return new RegExp(restr, opts)
}

var _re = {
    STRINGS: /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,
    DIVISOR: /(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/])/,
    REGEXPS: /(?=\/[^*\/]).[^\/[\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^\/[\\]*)*?(\/)[gim]*/,
    MLCOMMS: /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g
  }

_re.S_QBSRC = _re.STRINGS.source + '|' +
              _re.DIVISOR.source + '|' +  // $1: salsh of divisor operator
              _re.REGEXPS.source          // $2: last slash of regexp
