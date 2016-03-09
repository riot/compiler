/*
  Babel and babel-core 5.8.x JS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  tryreq = require('./_utils').tryreq,
  getdir = require('path').dirname

// istanbul ignore next: throws error if cannot load any
var parser = tryreq('babel') || require('babel-core')

var defopts = {
  blacklist: ['useStrict', 'strict', 'react'],
  sourceMaps: false,
  comments: false
}

module.exports = function _es6 (js, opts, url) {

  opts = mixobj(defopts, { resolveModuleSource: getdir(url) }, opts)

  return parser.transform(js, opts).code
}
