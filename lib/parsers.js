//#if 0
/*eslint no-unused-vars: [2, {args: "after-used", varsIgnorePattern: "^parsers*"}] */
//#endif
/**
 * @module parsers
 */
var parsers = (function () {

  var path = require('path')

  // cache of required modules, only 'babel' and 'none' (javascript)
  var _mods = {
    none: function (js) { return js }
  }
  _mods.javascript = _mods.none

  // object info for parser_name->module_name convertion
  var _modnames = {
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
  function modname (name) { return _modnames[name] || name }

  /**
   * Loads a parser instance via require, without generating error.
   *
   * @param   {string}   name  - the parser's name, one of parsers.html/jss/css
   * @param   {string}   [req] - name for require(), defaults to 'name'
   * @returns {Function} parser function, or null if error
   * @private
   */
  function _try (name, req) {

    function fn (r) {
      var p
      try { p = require(r) }
      catch (e) { p = null }
      return p
    }

    return _mods[name] =                  // eslint-disable-line no-return-assign
      name === 'es6' ?                    // istanbul ignore next
      fn('babel') || fn('babel-core') :   // babel v5.8.x
      fn(req || modname(name))
  }

  /**
   * Returns a parser instance by its name, require the module if necessary.
   * Public through the `parsers._req` function.
   *
   * @param   {string} name  - The parser's name, as registered in the parsers object
   * @param   {string} [req] - To be used by require(). Defaults to parser's name
   * @returns {Function} - The parser instance, null if the parser is not found
   */
  function _req (name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }

  /**
   * Merge two javascript object extending the properties of the first one with
   * the second.
   *
   * @param   {object} obj - source object
   * @param   {object} props - extra properties
   * @returns {object} source object containing the new properties
   */
  function extend (obj, props) {
    if (props) {
      for (var prop in props) {
        /* istanbul ignore next */
        if (props.hasOwnProperty(prop)) {
          obj[prop] = props[prop]
        }
      }
    }
    return obj
  }

  //// The parsers object --

  var _html = {
    jade: function (html, opts, url) {
      opts = extend({
        pretty: true,
        filename: url,
        doctype: 'html'
      }, opts)
      return _req('jade').render(html, opts)
    }
  }

  var _css = {
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
        filename: url,
        compress: true
      }, opts)
      _req('less').render(css, opts, function (err, result) {
        // istanbul ignore next
        if (err) throw err
        ret = result.css
      })
      return ret
    },
    stylus: function (tag, css, opts, url) {
      var
        stylus = _req('stylus'),
        nib = _req('nib') // optional nib support

      opts = extend({filename: url}, opts)
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css, opts).use(nib()).import('nib').render() : stylus.render(css, opts)
    }
  }

  var _js = {
    es6: function (js, opts) {
      opts = extend({
        blacklist: ['useStrict', 'strict', 'react'],
        sourceMaps: false,
        comments: false
      }, opts)
      return _req('es6').transform(js, opts).code
    },
    babel: function (js, opts, url) {
      return _req('babel').transform(js, extend({filename: url}, opts)).code
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({bare: true}, opts))
    },
    livescript: function (js, opts) {
      return _req('livescript').compile(js, extend({bare: true, header: false}, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript')(js, opts)
    },
    none: _mods.none, javascript: _mods.none
  }

  _js.coffeescript = _js.coffee     // 4 the nostalgics

  return {
    _modname: modname,
    _req: _req,
    html: _html,
    css: _css,
    js: _js
  }

})()
