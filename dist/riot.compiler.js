
/**
 * Compiler for riot custom tags
 * @module compiler
 * @version "0"
 */

// lib/parsers.js

var parsers = (function () {
  'use strict'

  var _mods = {'none': 'none'}

  function _try(name) {
    if (!(name in _mods)) {
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

  function _req(name) {
    var req = _get(name)
    return req ? require(req) : null
  }

  var _html = {
    jade: function (html) {
      return _req('jade').render(html, {pretty: true, doctype: 'html'})
    }
  }

  var _css = {
    stylus: function (tag, css) {
      var stylus = _req('stylus'),
          nib = _req('nib')
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
  _js.coffeescript = _js.coffee

  return {html: _html, css: _css, js: _js, _get: _get}

})()

// lib/core.js

var compile = (function () {
  'use strict'

  function _regEx(str, opt) { return new RegExp(str, opt) }

  var

    BOOL_ATTRS = _regEx(
      '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
      'compact|controls|default|formnovalidate|hidden|inert|ismap|itemscope|loop|' +
      'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
      'selected|sortable|truespeed|typemustmatch)$'),

    RIOT_ATTRS = ['style', 'src', 'd'],

    VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,

    HTML_ATTR  = /\s*([-\w:\.\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g,

    TRIM_TRAIL = /[ \t]+$/gm,

    _bp = null

  function q(s) {

    return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '') + "'"
  }

  function mktag(name, html, css, attrs, js, pcex) {
    var
      c = ', ',
      s = '}' + (pcex.length ? ', ' + q(_bp[8]) : '') + ');'

    if (/\S/.test(js)) {
      js = js.replace(/\n{3,}/g, '\n\n')
      if (js.slice(-1) !== '\n') s = '\n' + s
    }
    else js = ''

    return 'riot.tag2(' + q(name) + c + q(html) + c + q(css) + c + q(attrs) +
           ', function(opts) {\n' + js + s
  }

  function parseAttrs(str) {
    var list = [],
        match,
        k, v,
        DQ = '"'
    HTML_ATTR.lastIndex = 0

    while (match = HTML_ATTR.exec(str)) {

      k = match[1].toLowerCase()
      v = match[2]

      if (!v) {
        list.push(k)
      }
      else {

        if (v[0] !== DQ)
          v = DQ + (v[0] === "'" ? v.slice(1, -1) : v) + DQ

        if (k === 'type' && v.toLowerCase() === '"number"') {
          v = DQ + _bp[0] + "'number'" + _bp[1] + DQ
        }
        else if (/\u0001\d/.test(v)) {

          if (BOOL_ATTRS.test(k)) {
            k = '__' + k
          }
          else if (~RIOT_ATTRS.indexOf(k)) {
            k = 'riot-' + k
          }
        }

        list.push(k + '=' + v)
      }
    }
    return list.join(' ')
  }

  function splitHtml(html, opts, pcex) {

    if (html && _bp[4].test(html)) {
      var
        jsfn = opts.expr && (opts.parser || opts.type) ? compileJS : 0,
        list = brackets.split(html),
        expr

      for (var i = 1; i < list.length; i += 2) {
        expr = list[i]
        if (expr[0] === '^') {
          expr = expr.slice(1)
        }
        else if (jsfn) {
          expr = jsfn(expr, opts).replace(/[\r\n]+/g, ' ').trim()
          if (expr.slice(-1) === ';') expr = expr.slice(0, -1)
        }
        list[i] = "\u0001" + (pcex.push(expr.trim()) - 1) + _bp[1]
      }
      html = list.join('')
    }
    return html
  }

  function restoreExpr(html, pcex) {
    if (pcex.length) {
      html = html
        .replace(/\u0001(\d+)/g, function (_, d) {
          return _bp[0] + pcex[d].replace(/"/g, '&quot;')
        })
    }
    return html
  }

  var
    HTML_COMMENT = /<!--(?!>)[\S\s]*?-->/g,
    HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g

  function compileHTML(html, opts, pcex, intc) {

    if (!intc) {
      _bp = brackets.array(opts.brackets)
      html = html.replace(HTML_COMMENT, '').replace(TRIM_TRAIL, '')
    }
    if (!pcex) pcex = []

    html = splitHtml(html, opts, pcex)
      .replace(HTML_TAGS, function (_, name, attr, ends) {

        name = name.toLowerCase()

        ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''

        if (attr) name += ' ' + parseAttrs(attr)

        return '<' + name + ends + '>'
      })

    html = opts.whitespace ?
           html.replace(/\r\n?|\n/g, '\\n') : html.trim().replace(/\s+/g, ' ')

    if (opts.compact) html = html.replace(/> <([-\w\/])/g, '><$1')

    return restoreExpr(html, pcex)
  }

  var

      JS_RMCOMMS = _regEx(
      '(' + brackets.S_QBLOCKS + ')|' + brackets.R_MLCOMMS.source + '|//[^\r\n]*',
      'g'),

      JS_ES6SIGN = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m

  function riotjs(js) {
    var match,
        toes5,
        parts = [],
        pos

    js = js.replace(JS_RMCOMMS, function (m, q) { return q ? m : ' ' })

    while (match = js.match(JS_ES6SIGN)) {

      parts.push(RegExp.leftContext)
      js  = RegExp.rightContext
      pos = skipBlock(js)

      toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(match[2])
      if (toes5)
        match[0] = match[1] + 'this.' + match[2] + ' = function' + match[3]

      parts.push(match[0], js.slice(0, pos))
      js = js.slice(pos)
      if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
    }

    return parts.length ? parts.join('') + js : js

    function skipBlock(str) {
      var re = _regEx('([{}])|' + brackets.S_QBLOCKS, 'g'),
          level = 1,
          match

      while (level && (match = re.exec(str))) {
        if (match[1])
          match[1] === '{' ? ++level : --level
      }
      return level ? str.length : re.lastIndex
    }
  }

  function compileJS(js, opts, type) {
    if (!type) type = opts.type

    var parser = opts.parser || (type ? parsers.js[type] : riotjs)
    if (!parser)
      throw new Error('JS parser not found: "' + type + '"')

    return parser(js, opts).replace(TRIM_TRAIL, '')
  }

  var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;][^{}]*)(?={)|' + brackets.R_STRINGS.source, 'g')

  function scopedCSS(tag, style) {
    var scope = ':scope'

    return style.replace(CSS_SELECTOR, function (m, p1, p2) {

      if (!p2) return m

      p2 = p2.replace(/[^,]+/g, function (sel) {
        var s = sel.trim()

        if (s && s !== 'from' && s !== 'to' && s.slice(-1) !== '%') {

          if (s.indexOf(scope) < 0) s = scope + ' ' + s
          s = s.replace(scope, tag) + ',' +
              s.replace(scope, '[riot-tag="' + tag + '"]')
        }
        return sel.slice(-1) === ' ' ? s + ' ' : s
      })

      return p1 ? p1 + ' ' + p2 : p2
    })
  }

  function compileCSS(style, tag, type, scoped) {
    // istanbul ignore else
    if (type) {
      if (type === 'scoped-css') {
        scoped = true
      }
      else if (parsers.css[type]) {
        style = parsers.css[type](tag, style)
      }
      else if (type !== 'css') {
        throw new Error('CSS parser not found: "' + type + '"')
      }
    }

    style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

    return scoped ? scopedCSS(tag, style) : style
  }

  var TYPE_ATTR = /\stype\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i

  function getType(str) {

    if (str) {
      var match = str.match(TYPE_ATTR)
      str = match && (match[1] || match[2])
    }
    return str ? str.replace('text/', '') : ''
  }

  function getCode(code, opts, attrs) {
    var type = getType(attrs)

    return compileJS(code, opts, type)
  }

  var END_TAGS = /\/>\n|<(?:\/[\w\-]+\s*|[\w\-]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/g

  function splitBlocks(str) {
    var
      i, k, js = '', len = str.length

    if (len && str[len - 1] !== '>') {
      k = str.indexOf('<')
      if (k < 0 || (i = str.lastIndexOf('>\n')) < 0 || k > i)
        return ['', str]

      i += 2
      js = str.slice(i)
      str = str.slice(0, i)
      if (str[i - 3] !== '/') {

        if (str.match(END_TAGS)) {
          var s = RegExp.rightContext
          if (s) {
            js = s + js
            str = str.slice(0, len - js.length)
          }
        }
        else {
          js = str + js
          str = ''
        }
      }
    }
    return [str, js]
  }

  function compileTemplate(lang, html) {
    var parser = parsers.html[lang]

    if (!parser)
      throw new Error('Template parser not found: "' + lang + '"')

    return parser(html)
  }

  var
    CUST_TAG = /^[ \t]*<([-\w]+)\s*([^'"\/>]*(?:(?:\/[^>]|"[^"]*"|'[^']*')[^'"\/>]*)*)(?:\/|>\n?([^<]*(?:<(?!\/\1\s*>[ \t]*$)[^<]*)*)<\/\1\s*)>[ \t]*$/gim,
    STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
    SCRIPT = _regEx(STYLE.source.replace(/tyle/g, 'cript'), 'gi')

  function compile(src, opts, url) {

    if (!opts) opts = {}

    _bp = brackets.array(opts.brackets)

    if (opts.template)
      src = compileTemplate(opts.template, src)

    url = url ?
      '//src: ' + (/:\/\//.test(url) ? url : path.relative('.', url)) + '\n' : ''

    return url + src
      .replace(/\r\n?/g, '\n')
      .replace(CUST_TAG, function (_, tagName, attribs, body) {

        var
          jscode = '',
          styles = '',
          html = '',
          pcex = []

        tagName = tagName.toLowerCase()

        if (attribs)
          attribs = restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex)), pcex)

        body = body && body.replace(HTML_COMMENT, '')
        if (body) {

          body = body.replace(STYLE, function (_, _attrs, _style) {
            var scoped = _attrs && /\sscoped(\s|=|$)/i.test(_attrs)
            styles += (styles ? ' ' : '') +
              compileCSS(_style, tagName, getType(_attrs), scoped)
            return ''
          })

          body = body.replace(SCRIPT, function (_, _attrs, _script) {
            jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs)
            return ''
          })

          var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''))

          body = blocks[0]
          if (body)
            html = compileHTML(body, opts, pcex, 1)

          body = blocks[1]
          if (body && /\S/.test(body))
            jscode += (jscode ? '\n' : '') + compileJS(body, opts)
        }

        return mktag(tagName, html, styles, attribs, jscode, pcex)
      })
  }

})()

// lib/browser.js

riot.compile = (function () {
  'use strict'

  var doc = typeof window === 'object' ? window.document : null,
      promise,
      ready,
      forEach = Array.prototype.forEach

  function GET(url, callback) {
    var req = new XMLHttpRequest()

    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status === 200 || !req.status && req.responseText.length)
          callback(req.responseText, url)
      }
    }
    req.open('GET', url, true)
    req.send('')
  }

  function unindent(src) {
    var ident = src.match(/^[ \t]+/)
    if (ident) src = src.replace(new RegExp('^' + ident[0], 'gm'), '')
    return src
  }

  function globalEval(js) {
    var
      node = doc.createElement('script'),
      root = doc.documentElement

    node.text = js
    root.appendChild(node)
    root.removeChild(node)
  }

  function compileScripts(callback) {
    var
      scripts = doc.querySelectorAll('script[type="riot/tag"]'),
      scriptsAmount = scripts.length

    function done() {
      promise.trigger('ready')
      ready = true
      if (callback) callback()
    }

    function compileTag(source, url) {
      globalEval(compile(source, url))
      if (!--scriptsAmount) done()
    }

    if (scriptsAmount) {
      forEach.call(scripts, function (script) {
        var url = script.getAttribute('src')
        url ? GET(url, compileTag) : compileTag(script.innerHTML, url)
      })
    }
    else done()
  }

  return function _loadAndCompile(arg, fn) {

    if (typeof arg === 'string') {

      if (/^\s*</.test(arg)) {

        var js = unindent(compile(arg))
        if (!fn) globalEval(js)
        return js

      } else {

        return GET(arg, function (str, url) {
          var js = unindent(compile(str, url))
          globalEval(js)
          if (fn) fn(js, str)
        })
      }
    }

    fn = typeof arg !== 'function' ? undefined : arg

    if (ready)
      return fn && fn()

    if (promise) {
      if (fn)
        promise.on('ready', fn)

    } else {
      promise = riot.observable()
      compileScripts(fn)
    }
  }

})()

