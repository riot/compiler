var parsers = {
  html: {
    jade: function(html) {
      return require('jade').render(html, {pretty: true, doctype: 'html'})
    }
  },
  css: {
    stylus: function(tag, css) {
      var stylus = require('stylus')
      try {
        // optional nib support
        return stylus(css).use(require('nib')()).import('nib').render()
      } catch(e) {
        return stylus.render(css)
      }
    }
  },
  js: {
    none: function(js) {
      return js
    },
    livescript: function(js) {
      return require('livescript').compile(js, { bare: true, header: false })
    },
    typescript: function(js) {
      return require('typescript-simple')(js)
    },
    es6: function(js) {
      return require('babel').transform(js, { blacklist: ['useStrict'] }).code
    },
    coffee: function(js) {
      return require('coffee-script').compile(js, { bare: true })
    }
  }
}

parsers.js.javascript = parsers.js.none
// 4 the nostalgics
parsers.js.coffeescript = parsers.js.coffee
