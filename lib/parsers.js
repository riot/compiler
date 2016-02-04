/**
 * The compiler.parsers object holds the compiler's predefined parsers
 * @module
 */

var path = require('path')    // for sass

// dummy function for the none and javascript parsers
function _none (src) { return src }

/** Cache of required modules */
var _mods = {
  none: _none,
  javascript: _none
}

/**
 * Loads a parser instance via `require`, without generating error.
 *
 * @param   {string}   name       - one of the `html`, `css`, or `js` parsers.
 * @param   {string}   [req=name] - name for `require()`
 * @returns {function} parser function, or null if error
 */
function _try (name, req) {
  var mod

  try {
    switch (name) {
      // html
      case 'jade':
        mod = require('jade')
        break
      // css
      case 'sass':
      case 'scss':
        mod = require('node-sass')
        break
      case 'less':
        mod = require('less')
        break
      case 'stylus':
        mod = require('stylus')
        _mods.nib = null
        _mods.nib = require('nib')
        break
      // js
      case 'es6': // istanbul ignore next
        mod = require('babel') || require('babel-core')
        break
      case 'babel':
        mod = require('babel-core')
        break
      case 'coffee':
      case 'coffeescript':
        mod = require('coffee-script')
        break
      case 'livescript':
        mod = require('livescript')
        break
      case 'typescript':
        mod = require('typescript-simple')
        break
      default:
        mod = require(req || name)
        break
    }
  } catch (_) {
    /**/
  }
  _mods[name] = mod || (mod = null)

  return mod
}

/**
 * Returns a parser instance by its name, require the module if necessary.
 * Public through the `parsers._req` function.
 *
 * @param   {string} name  - The parser's name, as registered in the parsers object
 * @param   {string} [req] - To be used by `_try` with `require`
 * @returns {function} The parser instance, null if the parser is not found
 * @static
 */
function _req (name, req) {
  return name in _mods ? _mods[name] : _try(name, req)
}

/**
 * Merge the properties of the first object with the properties of the second.
 *
 * @param   {object} target - Target object
 * @param   {object} source - Source of the extra properties
 * @returns {object} Target object containing the new properties
 */
function extend (target, source) {
  if (source) {
    for (var prop in source) {
      /* istanbul ignore next */
      if (source.hasOwnProperty(prop)) {
        target[prop] = source[prop]
      }
    }
  }
  return target
}

module.exports = {
  /**
   * The HTML parsers.
   * @prop {function} jade - http://jade-lang.com
   */
  html: {
    jade: function (html, opts, url) {
      opts = extend({
        pretty: true,
        filename: url,
        doctype: 'html'
      }, opts)
      return _req('jade').render(html, opts)
    }
  },
  /**
   * Style parsers. In browsers, only less is supported.
   * @prop {function} sass   - http://sass-lang.com
   * @prop {function} scss   - http://sass-lang.com
   * @prop {function} less   - http://lesscss.org
   * @prop {function} stylus - http://stylus-lang.com
   */
  css: {
    sass: function (tag, css, opts, url) {
      opts = extend({
        data: css,
        includePaths: [path.dirname(url)],
        indentedSyntax: true,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)
      return _req('sass').renderSync(opts).css + ''
    },
    scss: function (tag, css, opts, url) {
      opts = extend({
        data: css,
        includePaths: [path.dirname(url)],
        indentedSyntax: false,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)
      return _req('scss').renderSync(opts).css + ''
    },
    less: function (tag, css, opts, url) {
      var ret

      opts = extend({
        sync: true,
        syncImport: true,
        filename: url
      }, opts)
      _req('less').render(css, opts, function (err, result) {
        /* istanbul ignore next */
        if (err) throw err
        ret = result.css
      })
      return ret
    },
    stylus: function (tag, css, opts, url) {
      var
        stylus = _req('stylus'),
        nib = _req('nib') // optional nib support

      opts = extend({ filename: url }, opts)
      /* istanbul ignore next: can't run both */
      return nib
        ? stylus(css, opts).use(nib()).import('nib').render() : stylus.render(css, opts)
    }
  },
  /**
   * The JavaScript parsers.
   * @prop {function} es6    - https://babeljs.io - babel or babel-core up to v5.8
   * @prop {function} babel  - https://babeljs.io - for v6.x or later
   * @prop {function} coffee - http://coffeescript.org
   * @prop {function} livescript - http://livescript.net
   * @prop {function} typescript - http://www.typescriptlang.org
   */
  js: {
    es6: function (js, opts) {
      opts = extend({
        blacklist: ['useStrict', 'strict', 'react'],
        sourceMaps: false,
        comments: false
      }, opts)
      return _req('es6').transform(js, opts).code
    },
    babel: function (js, opts, url) {
      return _req('babel').transform(js, extend({ filename: url }, opts)).code
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({ bare: true }, opts))
    },
    livescript: function (js, opts) {
      return _req('livescript').compile(js, extend({ bare: true, header: false }, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript')(js, opts)
    },
    none: _none, javascript: _none
  },
  _req: _req
}

exports = module.exports
exports.js.coffeescript = exports.js.coffee     // 4 the nostalgics
