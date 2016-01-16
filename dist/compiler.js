/* riot-compiler WIP, @license MIT, (c) 2015 Muut Inc. + contributors */
'use strict'

/**
 * @module parsers
 */
var parsers = (function () {

  var path = require('path')

  var _mods = {
    none: function (js) { return js }
  }

  _mods.javascript = _mods.none

  function modname (name) {
    /* istanbul ignore next */
    switch (name) {
      case 'es6':
        return 'babel'
      case 'babel':
        return 'babel-core'
      case 'javascript':
        return 'none'
      case 'coffee':
      case 'coffeescript':
        return 'coffee-script'
      case 'scss':
      case 'sass':
        return 'node-sass'
      case 'typescript':
        return 'typescript-simple'
      default:
        return name
    }
  }

  function _try (name, req) {

    function fn (r) {
      try { return require(r) }
      catch (_) { }
      return null
    }

    var p = _mods[name] = name === 'es6'  // istanbul ignore next
      ? fn('babel') || fn('babel-core')
      : fn(req || modname(name))

    return p
  }

  function _req (name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }

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
        nib = _req('nib')

      opts = extend({ filename: url }, opts)
      /* istanbul ignore next: can't run both */
      return nib
        ? stylus(css, opts).use(nib()).import('nib').render() : stylus.render(css, opts)
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
      return _req('babel').transform(js, extend({ filename: url }, opts)).code
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({ bare: true }, opts))
    },
    livescript: function (js, opts) {
      return _req('livescript').compile(js, extend({ bare: true, header: false }, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript')(js, opts)
    },
    none: _mods.none, javascript: _mods.none
  }

  _js.coffeescript = _js.coffee

  return {
    _modname: modname,
    _req: _req,
    html: _html,
    css: _css,
    js: _js
  }

})()

/**
 * @module brackets
 *
 * `brackets         ` Returns a string or regex based on its parameter
 * `brackets.settings` Mirrors the `riot.settings` object (use brackets.set in new code)
 * `brackets.set     ` Change the current riot brackets
 */

var brackets = (function () {

  var
    REGLOB  = 'g',

    MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
    STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,

    S_QBSRC = STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source,

    DEFAULT = '{ }',

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBSRC, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBSRC, REGLOB),
      '{': RegExp('([{}])|'   + S_QBSRC, REGLOB)
    },

    _pairs = [
      '{', '}',
      '{', '}',
      /{[^}]*}/,
      /\\({|})/g,
      /(\\?)({)/g,
      RegExp('(\\\\?)(?:([[({])|(}))|' + S_QBSRC, REGLOB),
      DEFAULT
    ]

  function _rewrite (re, bp) {
    return RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  var _brackets = {
    R_STRINGS: STRINGS,
    R_MLCOMMS: MLCOMMS,
    S_QBLOCKS: S_QBSRC
  }

  _brackets.split = function split (str, tmpl, _bp) {

    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _bp[6]

    isexpr = start = re.lastIndex = 0

    while (match = re.exec(str)) {

      pos = match.index

      if (isexpr) {

        if (match[2]) {
          re.lastIndex = skipBraces(match[2], re.lastIndex)
          continue
        }

        if (!match[3]) {
          continue
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos))
        start = re.lastIndex
        re = _bp[6 + (isexpr ^= 1)]
        re.lastIndex = start
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start))
    }

    return parts

    function unescapeStr (s) {
      if (isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'))
      }
      else {
        parts.push(s)
      }
    }

    function skipBraces (ch, ix) {
      var
        mm,
        rr = FINDBRACES[ch]

      rr.lastIndex = ix
      ix = 1

      while (mm = rr.exec(str)) {
        // istanbul ignore next
        if (mm[1] &&
          !(mm[1] === ch ? ++ix : --ix)) break
      }
      // istanbul ignore next
      return mm ? rr.lastIndex : str.length
    }
  }

  _brackets.array = function array (pair) {
    if (!pair || pair === DEFAULT) return _pairs

    var arr = pair.split(' ')

    // istanbul ignore next
    if (arr.length !== 2 || /[\x00-\x1F<>a-zA-Z0-9'",;\\]/.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    arr = arr.concat(pair.replace(/(?=[[\]()*+?.^$|])/g, '\\').split(' '))

    // istanbul ignore next
    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr)
    arr[5] = _rewrite(/\\({|})/g, arr)
    arr[6] = _rewrite(/(\\?)({)/g, arr)
    arr[7] = RegExp('(\\\\?)(?:([[({])|(' + arr[3] + '))|' + S_QBSRC, REGLOB)
    arr[8] = pair
    return arr
  }

  return _brackets

})()

/**
 * @module compiler
 */

function _regEx (str, opt) { return new RegExp(str, opt) }

var

  BOOL_ATTRS = _regEx(
    '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
    'compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|' +
    'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
    'selected|sortable|truespeed|typemustmatch)$'),

  RIOT_ATTRS = ['style', 'src', 'd'],

  VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,

  HTML_ATTR  = / *([-\w:\xA0-\xFF]+) ?(?:= ?('[^']*'|"[^"]*"|\S+))?/g,
  SPEC_TYPES = /^"(?:number|date(?:time)?|time|month|email|color)\b/i,
  TRIM_TRAIL = /[ \t]+$/gm,
  S_LINESTR  = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source,
  S_STRINGS  = brackets.R_STRINGS.source

var path = require('path')

function q (s) {
  return "'" + (s ? s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r') : '') + "'"
}

function mktag (name, html, css, attrs, js, pcex) {
  var
    c = ', ',
    s = '}' + (pcex.length ? ', ' + q(pcex._bp[8]) : '') + ');'

  if (js && js.slice(-1) !== '\n') s = '\n' + s

  return 'riot.tag2(\'' + name + "'" + c + q(html) + c + q(css) + c + q(attrs) +
         ', function(opts) {\n' + js + s
}

function parseAttrs (str, pcex) {
  var
    list = [],
    match,
    k, v, t, e,
    DQ = '"'

  HTML_ATTR.lastIndex = 0

  str = str.replace(/\s+/g, ' ')

  while (match = HTML_ATTR.exec(str)) {

    k = match[1].toLowerCase()
    v = match[2]

    if (!v) {
      list.push(k)
    }
    else {

      if (v[0] !== DQ) {
        v = DQ + (v[0] === "'" ? v.slice(1, -1) : v) + DQ
      }

      if (k === 'type' && SPEC_TYPES.test(v)) {
        t = v
      }
      else {
        if (/\u0001\d/.test(v)) {

          if (k === 'value') e = 1
          else if (BOOL_ATTRS.test(k)) k = '__' + k
          else if (~RIOT_ATTRS.indexOf(k)) k = 'riot-' + k
        }

        list.push(k + '=' + v)
      }
    }
  }

  if (t) {
    if (e) t = DQ + pcex._bp[0] + "'" + t.slice(1, -1) + "'" + pcex._bp[1] + DQ
    list.push('type=' + t)
  }
  return list.join(' ')
}

function splitHtml (html, opts, pcex) {
  var _bp = pcex._bp

  if (html && _bp[4].test(html)) {
    var
      jsfn = opts.expr && (opts.parser || opts.type) ? _compileJS : 0,
      list = brackets.split(html, 0, _bp),
      expr

    for (var i = 1; i < list.length; i += 2) {
      expr = list[i]
      if (expr[0] === '^') {
        expr = expr.slice(1)
      }
      else if (jsfn) {
        var israw = expr[0] === '='

        expr = jsfn(israw ? expr.slice(1) : expr, opts).trim()
        if (expr.slice(-1) === ';') expr = expr.slice(0, -1)
        if (israw) expr = '=' + expr
      }
      list[i] = '\u0001' + (pcex.push(expr.replace(/[\r\n]+/g, ' ').trim()) - 1) + _bp[1]
    }
    html = list.join('')
  }
  return html
}

function restoreExpr (html, pcex) {
  if (pcex.length) {
    html = html
      .replace(/\u0001(\d+)/g, function (_, d) {
        var expr = pcex[d]

        if (expr[0] === '=') {
          expr = expr.replace(brackets.R_STRINGS, function (qs) {
            return qs
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
          })
        }
        return pcex._bp[0] + expr.replace(/"/g, '\u2057')
      })
  }
  return html
}

var
  HTML_COMMENT = _regEx(/<!--(?!>)[\S\s]*?-->/.source + '|' + S_LINESTR, 'g'),
  HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g,
  PRE_TAG = /<pre(?:\s+(?:[^">]*|"[^"]*")*)?>([\S\s]+?)<\/pre\s*>/gi

function _compileHTML (html, opts, pcex) {

  html = splitHtml(html, opts, pcex)
    .replace(TRIM_TRAIL, '')
    .replace(HTML_TAGS, function (_, name, attr, ends) {

      name = name.toLowerCase()

      ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''

      if (attr) name += ' ' + parseAttrs(attr, pcex)

      return '<' + name + ends + '>'
    })

  if (!opts.whitespace) {
    if (/<pre[\s>]/.test(html)) {
      var p = []

      html = html.replace(PRE_TAG, function (_q) {
        p.push(_q)
        return '\u0002'
      }).trim().replace(/\s+/g, ' ')

      // istanbul ignore else
      if (p.length) html = html.replace(/\u0002/g, function () { return p.shift() })
    }
    else {
      html = html.trim().replace(/\s+/g, ' ')
    }
  }

  if (opts.compact) html = html.replace(/>[ \t]+<([-\w\/])/g, '><$1')

  return restoreExpr(html, pcex)
}

// istanbul ignore next
function compileHTML (html, opts, pcex) {
  if (Array.isArray(opts)) {
    pcex = opts
    opts = {}
  }
  else {
    if (!pcex) pcex = []
    if (!opts) opts = {}
  }

  html = html.replace(/\r\n?/g, '\n')
    .replace(HTML_COMMENT, function (s) { return s[0] === '<' ? '' : s })

  if (!pcex._bp) pcex._bp = brackets.array(opts.brackets)

  return _compileHTML(html, opts, pcex)
}

var
  JS_ES6SIGN = /^[ \t]*([$_A-Za-z][$\w]*)\s*\([^()]*\)\s*{/m,
  JS_RMCOMMS = _regEx(brackets.R_MLCOMMS.source + '|//[^\r\n]*|' + brackets.S_QBLOCKS, 'g'),
  JS_CLOSEBR = _regEx('([{}])|' + brackets.S_QBLOCKS, 'g')

function riotjs (js) {
  var
    match,
    toes5,
    parts = [],
    pos

  JS_RMCOMMS.lastIndex = 0
  while (match = JS_RMCOMMS.exec(js)) {
    var s = match[0]

    if (s[0] === '/' && !match[1] && !match[2]) {
      js = RegExp.leftContext + ' ' + RegExp.rightContext
      JS_RMCOMMS.lastIndex = match[3] + 1
    }
  }

  while (match = js.match(JS_ES6SIGN)) {

    parts.push(RegExp.leftContext)
    js  = RegExp.rightContext
    pos = skipBlock(js)

    toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(match[1])
    if (toes5) {
      match[0] = match[0].replace(match[1], 'this.' + match[1] + ' = function')
    }
    parts.push(match[0], js.slice(0, pos))
    js = js.slice(pos)
    if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
  }

  if (parts.length) js = parts.join('') + js

  return js

  function skipBlock (str) {
    var
      re = JS_CLOSEBR,
      level = 1,
      mm

    re.lastIndex = 0
    while (level && (mm = re.exec(str))) {
      if (mm[1]) mm[1] === '{' ? ++level : --level
    }
    return level ? str.length : re.lastIndex
  }
}

function _compileJS (js, opts, type, parserOpts, url) {
  if (!js) return ''
  if (!type) type = opts.type

  var parser = opts.parser || (type ? parsers.js[type] : riotjs)

  if (!parser) {
    throw new Error('JS parser not found: "' + type + '"')
  }
  return parser(js, parserOpts, url).replace(TRIM_TRAIL, '')
}

// istanbul ignore next
function compileJS (js, opts, type, extra) {
  if (typeof opts === 'string') {
    extra = type
    type = opts
    opts = {}
  }
  if (typeof type === 'object') {
    extra = type
    type = ''
  }
  else if (!extra) extra = {}

  return _compileJS(js, opts, type, extra.parserOptions, extra.url)
}

var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + S_LINESTR, 'g')

function scopedCSS (tag, style) {
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

function _compileCSS (style, tag, type, opts) {
  var scoped = (opts || (opts = {})).scoped

  if (type) {
    if (type === 'scoped-css') {
      scoped = true
    }
    else if (parsers.css[type]) {
      style = parsers.css[type](tag, style, opts.parserOpts || {}, opts.url)
    }
    else if (type !== 'css') {
      throw new Error('CSS parser not found: "' + type + '"')
    }
  }

  style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

  if (scoped) {
    // istanbul ignore next
    if (!tag) {
      throw new Error('Can not parse scoped CSS without a tagName')
    }
    style = scopedCSS(tag, style)
  }
  return style
}

// istanbul ignore next
function compileCSS (style, parser, opts) {
  if (parser && typeof parser === 'object') {
    opts = parser
    parser = ''
  }
  return _compileCSS(style, opts.tagName, parser, opts)
}

var
  TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,
  MISC_ATTR = '\\s*=\\s*(' + S_STRINGS + '|{[^}]+}|\\S+)'

function getType (str) {

  if (str) {
    var match = str.match(TYPE_ATTR)

    str = match && (match[2] || match[3])
  }
  return str ? str.replace('text/', '') : ''
}

function getAttr (str, name) {
  if (str) {
    var
      re = _regEx('\\s' + name + MISC_ATTR, 'i'),
      match = str.match(re)

    str = match && match[1]
    if (str) {
      return (/^['"]/).test(str) ? str.slice(1, -1) : str
    }
  }
  return ''
}

function getParserOptions (attrs) {
  var opts = getAttr(attrs, 'options')

  if (opts) opts = JSON.parse(opts)
  return opts
}

function getCode (code, opts, attrs, url) {
  var type = getType(attrs),
    parserOpts = getParserOptions(attrs)

  var src = getAttr(attrs, 'src')

  if (src) {
    var charset = getAttr(attrs, 'charset'),
      file = path.resolve(path.dirname(url), src)

    code = require('fs').readFileSync(file, charset || 'utf8')
  }
  return _compileJS(code, opts, type, parserOpts, url)
}

function cssCode (code, opts, attrs, url, tag) {
  var extraOpts = {
    parserOpts: getParserOptions(attrs),
    scoped: attrs && /\sscoped(\s|=|$)/i.test(attrs),
    url: url
  }

  return _compileCSS(code, tag, getType(attrs) || opts.style, extraOpts)
}

var END_TAGS = /\/>\n|^<(?:\/[-\w]+\s*|[-\w]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/

function splitBlocks (str) {
  var k, m

  /* istanbul ignore next: this if() can't be true, but just in case... */
  if (/<[-\w]/.test(str)) {
    k = str.lastIndexOf('<')
    while (~k) {
      m = str.slice(k).match(END_TAGS)
      if (m) {
        k += m.index + m[0].length
        return [str.slice(0, k), str.slice(k)]
      }
      k = str.lastIndexOf('<', k - 1)
    }
  }
  return ['', str]
}

function compileTemplate (html, url, lang, opts) {
  var parser = parsers.html[lang]

  if (!parser) {
    throw new Error('Template parser not found: "' + lang + '"')
  }
  return parser(html, opts, url)
}

var
  CUST_TAG = _regEx(/^([ \t]*)<([-\w]+)(?:\s+([^'"\/>]+(?:(?:@|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/
    .source.replace('@', S_STRINGS), 'gim'),
  SCRIPTS = /<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi,
  STYLES = /<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi

function compile (src, opts, url) {
  var
    parts = [],
    exclude

  if (!opts) opts = {}

  if (!url) url = process.cwd() + '/.'

  exclude = opts.exclude || false
  function included (s) { return !(exclude && ~exclude.indexOf(s)) }

  var _bp = brackets.array(opts.brackets)

  if (opts.template) {
    src = compileTemplate(src, url, opts.template, opts.templateOptions)
  }

  src = src
    .replace(/\r\n?/g, '\n')
    .replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {

      var
        jscode = '',
        styles = '',
        html = '',
        pcex = []

      pcex._bp = _bp

      tagName = tagName.toLowerCase()

      attribs = attribs && included('attribs')
        ? restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex), pcex), pcex) : ''

      if (body2) body = body2

      if (body && (body = body.replace(HTML_COMMENT,
        function (s) { return s[0] === '<' ? '' : s })) && /\S/.test(body)) {

        if (body2) {
          /* istanbul ignore next */
          html = included('html') ? _compileHTML(body2, opts, pcex) : ''
        }
        else {

          var blocks = splitBlocks(
            body.replace(_regEx('^' + indent, 'gm'), '').replace(TRIM_TRAIL, '')
          )

          body = blocks[0].replace(STYLES, function (_m, _attrs, _style) {
            if (included('css')) {
              styles += (styles ? ' ' : '') + cssCode(_style, opts, _attrs, url, tagName)
            }
            return ''
          })

          body = body.replace(SCRIPTS, function (_m, _attrs, _script) {
            if (included('js')) {
              jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
            }
            return ''
          })

          if (included('html')) {
            html = _compileHTML(body, opts, pcex)
          }

          if (included('js')) {
            body = blocks[1]
            if (/\S/.test(body)) {
              jscode += (jscode ? '\n' : '') + _compileJS(body, opts, null, null, url)
            }
          }
        }
      }

      jscode = /\S/.test(jscode) ? jscode.replace(/\n{3,}/g, '\n\n') : ''

      if (opts.entities) {
        parts.push({
          tagName: tagName,
          html: html,
          css: styles,
          attribs: attribs,
          js: jscode
        })
        return ''
      }

      return mktag(tagName, html, styles, attribs, jscode, pcex)
    })

  if (opts.entities) return parts

  if (opts.debug) {
    /* istanbul ignore if */
    if (path.isAbsolute(url)) url = path.relative('.', url)
    src = '//src: ' + url.replace(/\\/g, '/') + '\n' + src
  }
  return src
}

module.exports = {
  compile: compile,
  html: compileHTML,
  style: _compileCSS,
  css: compileCSS,
  js: compileJS,
  parsers: parsers,
  version: 'WIP'
}
