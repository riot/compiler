/*
  Stylus CSS plugin, with optional nib support.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  tryreq = require('./_utils').tryreq,
  parser = require('stylus')

// Optional nib support
var nib = tryreq('nib')

// istanbul ignore next: can't run both
module.exports = nib
  ? function _stylus (tag, css, opts, url) {
    opts = mixobj({ filename: url }, opts)
    return parser(css, opts).use(nib()).import('nib').render()
  }
  : function _stylus (tag, css, opts, url) {
    opts = mixobj({ filename: url }, opts)
    return parser.render(css, opts)
  }
