/*
  babel-core 6.x JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('babel-core')

module.exports = function _babel (js, opts, url) {

  opts = mixobj({ filename: url }, opts)

  return parser.transform(js, opts).code
}
