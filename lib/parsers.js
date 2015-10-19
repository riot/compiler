var parsers = (function () {
//#if !RIOT_CLI
  'use strict'  // eslint-disable-line strict, no-extra-strict
//#endif

  // cache for the names of modules
  var _mods = {'none': 'none'}

  function _try(name) {
    if (!(name in _mods)) {
//#if DEBUG
      console.log('--- DEBUG: parsers is testing require with `' + name + '`...')
//#endif
      try {
        _mods[name] = require.resolve(name)
      }
      catch (e) {
        _mods[name] = ''
      }
    }
    return _mods[name]
  }

  function _get(name) {
    var req = name
    switch (name) {
      case 'es6':
      case 'babel':
        return _try('babel-core') || _try('babel')
      case 'javascript':
        return _mods.none
      case 'typescript':
        req += '-simple'
        break
      case 'coffee':
      case 'coffeescript':
        req = 'coffee-script'
        break
      default:
        break
    }
    return _try(req)
  }

  // we can add error handling here: 'Please install your super tool'
  function _req(name) {
    var req = _get(name)
    return req ? require(req) : null  // allow test & require (nib)
  }

  // ## The parsers object

  var _html = {
    jade: function (html) {
      return _req('jade').render(html, {pretty: true, doctype: 'html'})
    }
  }

  var _css = {
    stylus: function (tag, css) {
      var stylus = _req('stylus'),
          nib = _req('nib')          // optional nib support
      if (nib)
        return stylus(css).use(nib()).import('nib').render()
      else
        return stylus.render(css)
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

  return {html: _html, css: _css, js: _js, _get: _get}

})()
