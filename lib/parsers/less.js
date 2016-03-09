/*
  Less CSS plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('less')

var defopts = {
  sync: true,
  syncImport: true,
  compress: true
}

module.exports = function _less (tag, css, opts, url) {
  var ret

  opts = mixobj(defopts, { filename: url }, opts)

  parser.render(css, opts, function (err, result) {
    // istanbul ignore next
    if (err) throw err
    ret = result.css
  })

  return ret
}
