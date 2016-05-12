
'use strict'

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

module.exports = safeRegex
