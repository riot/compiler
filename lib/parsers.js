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
  function _try(name) {
    var req

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
    // istanbul ignore next: we have babel-core in test
    case 'babel':
      return fn('babel-core') || fn('babel')
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
      req = name
      break
    }
    return fn(req)
  }
  //#else
  function _try(name) {   //eslint-disable-line no-redeclare
    var req
    switch (name) {
    case 'coffee':
      req = 'CoffeeScript'
      break
    case 'es6':
      req = 'babel'
      break
    default:
      req = name
      break
    }
    return _mods[name] = (window || global)[req]
  }
  //#endif

  // Returns a parser instance, null if the parser is not found.
  // Public through the parsers._get function.
  function _req(name) {
    return name in _mods ? _mods[name] : _try(name)
  }

  //// The parsers object --

  var _html = {
    jade: function (html) {
      return _req('jade').render(html, {pretty: true, doctype: 'html'})
    }
  }

  var _css = {
    stylus: function (tag, css) {
      var
        stylus = _req('stylus'), nib = _req('nib') // optional nib support
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css).use(nib()).import('nib').render() : stylus.render(css)
    }
  }

  var _js = {
    none: function (js) {
      return js
    },
    livescript: function (js) {
      return _req('livescript').compile(js, {bare: true, header: false})
    },
    typescript: function (js) {
      return _req('typescript')(js).replace(/\r\n?/g, '\n')
    },
    es6: function (js) {
      return _req('es6').transform(js, {
        blacklist: ['useStrict', 'react'], sourceMaps: false, comments: false
      }).code
    },
    coffee: function (js) {
      return _req('coffee').compile(js, {bare: true})
    }
  }

  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {html: _html, css: _css, js: _js, _get: _req}

})()

//#if RIOT
riot.parsers = parsers
//#endif
