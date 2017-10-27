/*
  CoffeeScript JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj

var parser
try {
  parser = require('coffeescript')
} catch (e) {
  parser = require('coffee-script')
}

var defopts = {
  bare: true
}

module.exports = function _coffee (js, opts) {
  return parser.compile(js, mixobj(defopts, opts))
}
