var
  extend = require('./_utils').extend,
  path = require('path'),
  sass = require('node-sass')

exports = function _scss(tag, css, opts, url) {

  return sass.renderSync(extend({
    data: css,
    includePaths: [path.dirname(url)],
    indentedSyntax: false,
    omitSourceMapUrl: true,
    outputStyle: 'compact'
  }, opts)).css + ''

}
