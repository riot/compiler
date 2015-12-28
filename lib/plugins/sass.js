var
  extend = require('./_utils').extend,
  path = require('path'),
  sass = require('node-sass')

exports = function _sass(tag, css, opts, url) {

  return sass.renderSync(extend({
    data: css,
    includePaths: [path.dirname(url)],
    indentedSyntax: true,
    omitSourceMapUrl: true,
    outputStyle: 'compact'
  }, opts)).css + ''

}
