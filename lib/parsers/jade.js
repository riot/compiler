/*
  Jade HTML plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('jade')

var defopts = {
  pretty: true,
  doctype: 'html'
}

module.exports = function _jade (html, opts, url) {

  opts = mixobj(defopts, { filename: url }, opts)

  return parser.render(html, opts)
}
