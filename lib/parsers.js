/**
 * @module parsers
 */
var parsers = (function () {
  var _mods = {         // cache of required modules
    none: function (js) {
      return js
    }
  }
  _mods.javascript = _mods.none

  //#if NODE
  var _modnames = {     // for name-module convertion
    es6: 'babel',
    babel: 'babel-core',
    javascript: 'none',
    typescript: 'typescript-simple',
    coffee: 'coffee-script',
    coffeescript: 'coffee-script',
    scss: 'node-sass',
    sass: 'node-sass'
  }

  /**
   * Returns the module name for the given parser name.
   *
   * @param   {string}   name  - the _mods element, one of parsers.html/jss/css
   * @returns {Function} parser function, or null if error
  */
  function _modname(name) {
    return _modnames[name] || name
  }
  //#endif

  /**
   * Loads a parser instance.
   * On success, saves the function in _mods before return it to caller.
   *
   * @param   {string}   name  - the _mods element, one of parsers.html/jss/css
   * @param   {string}   [req] - name for require(), defaults to 'name'
   * @returns {Function} parser function, or null if error
  */
  function _try(name, req) {  //eslint-disable-line complexity
    var parser

  //#if NODE
    function fn(r) {
      try {
        _mods[name] = require(r)
      }
      catch (e) {
        _mods[name] = null
      }
      return _mods[name]
    }

    /* istanbul ignore next */
    if (name === 'es6')
      return fn('babel') || fn('babel-core')  // versions 5.8x

    parser = fn(req || _modname(name))
  //#else

    switch (name) {
    case 'coffee':
      req = 'CoffeeScript'
      break
    case 'es6':
    case 'babel':
      req = 'babel'
      break
    case 'none':
    case 'javascript':
      return _mods.none
    default:
      if (!req) req = name
      break
    }
    parser = window[req]

    if (!parser)
      throw new Error(req + ' parser not found.')
    _mods[name] = parser
  //#endif

    return parser
  }

  // Returns a parser instance, null if the parser is not found.
  // Public through the parsers._get function.
  function _req(name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }

  //// The parsers object --

  var _html = {
    jade: function (html, opts, url) {
      return _req('jade').render(html, extend({
        pretty: true,
        filename: url,
        doctype: 'html'
      }, opts))
    }
  }

  var _css = {
    //#if NODE
    sass: function(tag, css, opts, url) {    // there's no standard sass for browsers
      var sass = _req('sass')

      return sass.renderSync(extend({
        data: css,
        indentedSyntax: true,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)).css + ''
    },
    scss: function(tag, css, opts, url) {    // there's no standard sass for browsers
      var scss = _req('scss')

      return scss.renderSync(extend({
        data: css,
        indentedSyntax: false,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts)).css + ''
    },
    //#endif
    less: function(tag, css, opts, url) {
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
    stylus: function (tag, css, opts, url) {
      var
        stylus = _req('stylus'), nib = _req('nib') // optional nib support
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css).use(nib()).import('nib').render() : stylus.render(css)
    }
  }

  var _js = {
    livescript: function (js, opts, url) {
      return _req('livescript').compile(js, extend({bare: true, header: false}, opts))
    },
    typescript: function (js, opts, url) {
      return _req('typescript')(js, opts).replace(/\r\n?/g, '\n')
    },
    es6: function (js, opts, url) {
      return _req('es6').transform(js, extend({
        blacklist: ['useStrict', 'strict', 'react'], sourceMaps: false, comments: false
      }, opts)).code
    },
    babel: function (js, opts, url) {
      // istanbul ignore next: url empty if comming from expression
      return _req('babel').transform(js,
        extend({
          filename: url || ''
        }, opts)
      ).code
    },
    coffee: function (js, opts, url) {
      return _req('coffee').compile(js, extend({bare: true}, opts))
    },
    none: _mods.none
  }

  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {
    html: _html,
    css: _css,
    js: _js,
    //#if NODE
    _modname: _modname,
    //#endif
    _req: _req}

})()
