/*
  LiveScript JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('livescript')

var defopts = {
  bare: true,
  header: false
}

module.exports = function _livescript (js, opts) {
  return parser.compile(js, mixobj(defopts, opts))
}
