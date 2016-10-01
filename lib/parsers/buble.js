/*
  bublé 0.13.x JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-08-26: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('buble')

module.exports = function _buble (js, opts, url) {

  opts = mixobj({ source: url, modules: false }, opts)

  return parser.transform(js, opts).code
}
