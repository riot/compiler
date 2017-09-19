//#if 0
/*eslint no-unused-vars: [2, {args: "after-used", varsIgnorePattern: "^parsers*"}] */
/*global window */
//#endif
/**
 * @module parsers
 */
var parsers = (function (win) {

  var _p = {}   // parsers

  /*
   * Internal function to access a parser
   */
  function _r (name) {
    var parser = win[name]

    if (parser) return parser

    throw new Error('Parser "' + name + '" not loaded.')
  }

  /**
   * Returns a parser instance by its name, get the variable from the global object.
   * Public through the `parsers._req` function.
   *
   * @param   {string} name - The parser's branch and name in dot notation
   * @returns {Function} The parser instance, null if the parser is not found.
   */
  function _req (name) {
    var parts = name.split('.')

    if (parts.length !== 2) throw new Error('Bad format for parsers._req')

    var parser = _p[parts[0]][parts[1]]
    if (parser) return parser

    throw new Error('Parser "' + name + '" not found.')
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

  function renderPug (compilerName, html, opts, url) {
    opts = extend({
      pretty: true,
      filename: url,
      doctype: 'html'
    }, opts)
    return _r(compilerName).render(html, opts)
  }

  //// The parsers object --

  _p.html = {
    jade: function (html, opts, url) {
      /* eslint-disable */
      console.log('DEPRECATION WARNING: jade was renamed "pug" - The jade parser will be removed in riot@3.0.0!')
      /* eslint-enable */
      return renderPug('jade', html, opts, url)
    },
    pug: function (html, opts, url) {
      return renderPug('pug', html, opts, url)
    }
  }
  _p.css = {
    less: function (tag, css, opts, url) {
      var ret

      opts = extend({
        sync: true,
        syncImport: true,
        filename: url
      }, opts)
      _r('less').render(css, opts, function (err, result) {
        // istanbul ignore next
        if (err) throw err
        ret = result.css
      })
      return ret
    }
  }
  _p.js = {
    // Babel should be handled differently depending on the environement where we are
    es6: function (js, opts, url) {   // eslint-disable-line no-unused-vars
    /*#if NODE
      return _r('babel').transform(js, extend({ filename: url }, opts)).code
//#else */
      return _r('Babel').transform( // eslint-disable-line
        js,
        extend({
          plugins: [
            ['transform-es2015-template-literals', { loose: true }],
            'transform-es2015-literals',
            'transform-es2015-function-name',
            'transform-es2015-arrow-functions',
            'transform-es2015-block-scoped-functions',
            ['transform-es2015-classes', { loose: true }],
            'transform-es2015-object-super',
            'transform-es2015-shorthand-properties',
            'transform-es2015-duplicate-keys',
            ['transform-es2015-computed-properties', { loose: true }],
            ['transform-es2015-for-of', { loose: true }],
            'transform-es2015-sticky-regex',
            'transform-es2015-unicode-regex',
            'check-es2015-constants',
            ['transform-es2015-spread', { loose: true }],
            'transform-es2015-parameters',
            ['transform-es2015-destructuring', { loose: true }],
            'transform-es2015-block-scoping',
            'transform-es2015-typeof-symbol',
            ['transform-es2015-modules-commonjs', { allowTopLevelThis: true }],
            ['transform-regenerator', { async: false, asyncGenerators: false }]
          ]
        },
        opts
        )).code
    //#endif
    },
    buble: function (js, opts, url) {
      opts = extend({
        source: url,
        modules: false
      }, opts)
      return _r('buble').transform(js, opts).code
    },
    coffee: function (js, opts) {
      return _r('CoffeeScript').compile(js, extend({ bare: true }, opts))
    },
    livescript: function (js, opts) {
      return _r('livescript').compile(js, extend({ bare: true, header: false }, opts))
    },
    typescript: function (js, opts) {
      return _r('typescript')(js, opts)
    },
    none: function (js) {
      return js
    }
  }
  _p.js.javascript   = _p.js.none
  _p.js.coffeescript = _p.js.coffee   // 4 the nostalgics
  _p._req  = _req
  _p.utils = {
    extend: extend
  }

  return _p

})(window || global)
