var parsers = (function () {

  function tryreq(name) {
//#if DEBUG
    console.log('--- DEBUG: parsers is testing require with `' + name + '` ...')
//#endif
    try {
      return require.resolve(name)
    }
    catch (e) {/**/}
    return ''
  }

  var _mods = {}

  var _html = {
    jade: function (html) {
      return require('jade').render(html, { pretty: true, doctype: 'html' })
    }
  }

  var _css = {
    stylus: function (tag, css) {
      var stylus = require('stylus'),
          nib = 'nib'
      // optional nib support
      nib = nib in _mods ? _mods.nib : (_mods.nib = tryreq(nib))  // eslint-disable-line no-extra-parens
      if (nib)
        return stylus(css).use(require(nib)()).import('nib').render()
      else
        return stylus.render(css)
    }
  }

  var _js = {
    none: function (js) {
      return js
    },

    livescript: function (js) {
      return require('livescript').compile(js, { bare: true, header: false })
    },

    typescript: function (js) {
      return require('typescript-simple')(js)
    },

    es6: function (js) {
      var name = _mods.babel,
          opts = {
            blacklist: ['useStrict', 'react'], sourceMaps: false, comments: false
          }
      if (!name) {
        name = 'babel-core'
        _mods.babel = tryreq(name) || (name = 'babel')
      }
      return require(name).transform(js, opts).code
    },

    coffee: function (js) {
      return require('coffee-script').compile(js, { bare: true })
    }
  }

  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {
    html: _html,
    css: _css,
    js: _js
  }

})()
