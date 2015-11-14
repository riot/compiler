/**
 * @module parsers
 */
var parsers = (function () {
  var _mods = {}    // cache of modules

  /**
   * Loads a parser instance.
   * On success, saves the function in _mods before return it to caller.
   * @param   {string}   name  - the _mods element, one of parsers.html/jss/css
   * @param   {string}   [req] - name for require(), defaults to 'name'
   * @returns {Function} parser function, or null if error
  */
  //#if NODE
  function _try(name, req) {  //eslint-disable-line complexity

    function fn(r) {
      try {
        _mods[name] = require(r)
      }
      catch (e) {
        _mods[name] = null
      }
      return _mods[name]
    }

    switch (name) {
    case 'es6':
    /* istanbul ignore next */
      return fn('babel') || fn('babel-core')  // versions 5.8x
    case 'babel':
      req = 'babel-core'
      break
    case 'none':
    case 'javascript':
      return _js.none
    case 'typescript':
      req = name + '-simple'
      break
    case 'coffee':
    case 'coffeescript':
      req = 'coffee-script'
      break
    /* istanbul ignore next */
    case 'scss':
    case 'sass':
      req = 'node-sass'
      break
    default:
      if (!req) req = name
      break
    }
    return fn(req)
  }
  //#else
  function _try(name, req) {   //eslint-disable-line no-redeclare

    switch (name) {
    case 'coffee':
      req = 'CoffeeScript'
      break
    case 'es6':
      req = 'babel'
      break
    default:
      if (!req) req = name
      break
    }
    return _mods[name] = window[req]
  }
  //#endif

  // Returns a parser instance, null if the parser is not found.
  // Public through the parsers._get function.
  function _req(name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }

  //// The parsers object --

  var _html = {
    jade: function (html, opts) {
      return _req('jade').render(html, extend({pretty: true, doctype: 'html'}, opts))
    }
  }

  var _css = {
    //#if NODE
    sass: function(tag, css, opts) {    // there's no standard sass for browsers
      var sass = _req('sass')

      return sass.renderSync(extend({
        data: css,
        indentedSyntax: true,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)).css + ''
    },
    scss: function(tag, css, opts) {    // there's no standard sass for browsers
      var sass = _req('sass')

      return sass.renderSync(extend({
        data: css,
        indentedSyntax: false,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)).css + ''
    },
    less: function(tag, css, opts) {
      var less = _req('less'),
        ret

      less.render(css, extend({       // less has a different API for browser
        sync: true,
        compress: true
      }, opts), function (err, result) {
        // istanbul ignore next
        if (err) throw err
        ret = result.css
      })
      return ret
    },
    //#endif
    stylus: function (tag, css, opts) {
      var
        stylus = _req('stylus'), nib = _req('nib') // optional nib support
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css).use(nib()).import('nib').render() : stylus.render(css)
    }
  }

  var _js = {
    none: function (js, opts) {
      return js
    },
    livescript: function (js, opts) {
      return _req('livescript').compile(js, extend({bare: true, header: false}, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript')(js, opts).replace(/\r\n?/g, '\n')
    },
    es6: function (js, opts) {
      return _req('es6').transform(js, extend({
        blacklist: ['useStrict', 'strict', 'react'], sourceMaps: false, comments: false
      }, opts)).code
    },
    babel: function (js, opts) {
      js = 'function __parser_babel_wrapper__(){' + js + '}'
      return _req('babel').transform(js,
        extend({
          presets: ['es2015']
        }, opts)
      ).code.replace(/["']use strict["'];[\r\n]+/, '').slice(38, -2)
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({bare: true}, opts))
    }
  }

  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {html: _html, css: _css, js: _js, _req: _req}

})()

//#if RIOT
riot.parsers = parsers
//#endif
