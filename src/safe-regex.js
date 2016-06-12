/**
 * Very basic safe regex substitution of unsafe characters.
 *
 * It takes a source regex and a variable number of string parameters.
 * In the source regexp, each '@' character is replaced in turn by the
 * parameter in the same position (starting in 1), which have added an
 * escape character.
 *
 * Example:
 * ```js
 *     myre = safeRegex(/[@-@a-zA-Z0-9]/, 'x00', 'x1F')
 *     // now myre is /[\x00-\x1Fa-zA-Z0-9]/
 * ```
 *
 * NOTE: Only the flags global, ignoreCase and multiline are preserved.
 *
 * @param   {RegExp} re - The source regex, where the replacements take place
 * @returns {RegExp} The new RegExp, with the markers replaced with escaped characters.
 */
//#if NODE
'use strict'
//#endif

// istanbul ignore next
function safeRegex (re) {
  var src = re.source
  var opt = re.global ? 'g' : ''

  if (re.ignoreCase) opt += 'i'
  if (re.multiline)  opt += 'm'

  for (var i = 1; i < arguments.length; i++) {
    src = src.replace('@', '\\' + arguments[i])
  }

  return new RegExp(src, opt)
}

//#if NODE
module.exports = safeRegex
//#endif
