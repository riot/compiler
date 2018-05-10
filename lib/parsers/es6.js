/*
  babel-core 6.x JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/

// The babel core should be handled differently in its newest version
// this function will allow the import of the right babel package installed
function getBabelCore() {
  try {
    return require('@babel/core')
  } catch (_) {
    console.log('Fallback to babel-core. You might want to upgrade to @babel/core soon.')
    return require('babel-core')
  }
}

var
  mixobj = require('./_utils').mixobj,
  parser = getBabelCore()

module.exports = function _babel (js, opts, url) {

  opts = mixobj({ filename: url }, opts)

  return parser.transform(js, opts).code
}
