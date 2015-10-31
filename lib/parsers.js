/**
 * @module parsers
 */
var parsers = (function () {
  var _mods = {}    // cache of modules

  /*
    Search a instance for a parser.
    If found, saves the function in _mods before return it to caller.
    Returns null if not found.
  */
  //#if NODE
  function _try(name, req) {

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
      req = 'babel'
      break
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
    stylus: function (tag, css, opts) {
      var
        stylus = _req('stylus'), nib = _req('nib') // optional nib support
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css).use(nib()).import('nib').render() : stylus.render(css)
    },
    sass: function(tag, css, opts) {
      var sass = _req('sass')

      return sass.renderSync(extend({
        data: css,
        indentedSyntax: true,
        omitSourceMapUrl: true,
        outputStyle: 'compact'
      }, opts))
    },
    less: function(tag, css, opts) {
      var less = _req('less'),
        ret

      less.render(css, extend({
        sync: true,
        compress: true
      }, opts), function (err, result) {
        if (err) throw err
        ret = result.css
      })
      return ret
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
        blacklist: ['useStrict', 'react'], sourceMaps: false, comments: false
      }, opts)).code
    },
    babel: function (js, opts) {
      return _req('babel').transform(js, extend({
        presets: ['es2015'], ast: false, sourceMaps: false, comments: false
      }, opts)).code
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({bare: true}, opts))
    }
  }

  _css.scss   = _css.sass // fix possible issues
  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {html: _html, css: _css, js: _js, _req: _req}

})()

//#if RIOT
riot.parsers = parsers
//#endif
