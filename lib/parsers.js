/**
 * The compiler.parsers object holds the compiler's predefined parsers
 * @module
 */

var path = require('path')    // for sass

// Dummy function for the none and javascript parsers
function _none (src) {
  return src
}

// Initialize the cache with modules that cannot be required
var _mods = { none: _none, javascript: _none }

/**
 * Loads a parser instance via `require`, with option to ignore errors.
 *
 * @param   {string}   name       - one of the `html`, `css`, or `js` parsers.
 * @param   {string}   [req=name] - name for `require()`
 * @param   {number}   [fail]     - 1 if must throw any error
 * @returns {function} parser function, or null if error
 */
function _try (name, req, fail) {   // eslint-disable-line complexity
  var err, mod

  // istanbul ignore if
  if (typeof req === 'number') {
    fail = req
    req = name
  } else if (!req) {
    req = name
  }

  function __b () {
    try {
      mod = require('babel')
    } catch (_) {
      // istanbul ignore next
      try {
        mod = require('babel-core')
      } catch (e) { err = e }
    }
  }

  try {
    switch (req) {
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
        break
      case 'nib':
        mod = require('nib')
        break
      // js
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
      case 'es6':
        __b()
        break
      default:
        mod = require(req)
        break
    }
  } catch (e) { err = e }

  // istanbul ignore next
  if (err && fail && !mod) throw err

  return _mods[name] = mod || null  // eslint-disable-line no-return-assign
}

/**
 * Returns a parser instance by its name, require the module if necessary.
 * Public through the `parsers._req` function.
 *
 * @param   {string} name  - The parser's name, as registered in the parsers object
 * @param   {string} [req] - To be used by `_try` with `require`
 * @param   {number} [fail] - 1 if must throw any error
 * @returns {function} The parser instance, null if the parser is not found
 * @static
 */
function _req (name, req, fail) {
  return name in _mods ? _mods[name] : _try(name, req, fail)
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
      return _req('jade', 1).render(html, opts)
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
      return _req('sass', 1).renderSync(opts).css + ''
    },
    scss: function (tag, css, opts, url) {
      opts = extend({
        data: css,
        includePaths: [path.dirname(url)],
        indentedSyntax: false,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)
      return _req('scss', 1).renderSync(opts).css + ''
    },
    less: function (tag, css, opts, url) {
      var ret

      opts = extend({
        sync: true,
        syncImport: true,
        filename: url
      }, opts)
      _req('less', 1).render(css, opts, function (err, result) {
        /* istanbul ignore next */
        if (err) throw err
        ret = result.css
      })
      return ret
    },
    stylus: function (tag, css, opts, url) {
      var
        stylus = _req('stylus', 1),
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
      return _req('es6', 1).transform(js, opts).code
    },
    babel: function (js, opts, url) {
      return _req('babel', 1).transform(js, extend({ filename: url }, opts)).code
    },
    coffee: function (js, opts) {
      return _req('coffee', 1).compile(js, extend({ bare: true }, opts))
    },
    livescript: function (js, opts) {
      return _req('livescript', 1).compile(js, extend({ bare: true, header: false }, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript', 1)(js, opts)
    },
    none: _none, javascript: _none
  },
  _req: _req
}

module.exports.js.coffeescript = module.exports.js.coffee     // 4 the nostalgics
