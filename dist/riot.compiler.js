
/**
 * @module parsers
 */
var parsers = (function () {
  var _mods = {
    none: function (js) {
      return js
    }
  }
  _mods.javascript = _mods.none

  function _try(name, req) {  //eslint-disable-line complexity
    var parser

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

    return parser
  }

  function _req(name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }

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
    less: function(tag, css, opts, url) {
      var less = _req('less'),
        ret

      less.render(css, extend({
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
        stylus = _req('stylus'), nib = _req('nib')
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
  _js.coffeescript = _js.coffee

  return {
    html: _html,
    css: _css,
    js: _js,
    _req: _req}

})()

riot.parsers = parsers

/**
 * Compiler for riot custom tags
 * @version v2.3.19
 */
var compile = (function () {

  function _regEx(str, opt) { return new RegExp(str, opt) }

  var

    BOOL_ATTRS = _regEx(
      '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
      'compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|' +
      'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
      'selected|sortable|truespeed|typemustmatch)$'),

    RIOT_ATTRS = ['style', 'src', 'd'],

    VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,

    HTML_ATTR  = /\s*([-\w:\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g,

    TRIM_TRAIL = /[ \t]+$/gm

  function q(s) {
    return "'" + (s ? s
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') :
      '') + "'"
  }

  function mktag(name, html, css, attrs, js, pcex) {
    var
      c = ', ',
      s = '}' + (pcex.length ? ', ' + q(pcex._bp[8]) : '') + ');'

    if (js && js.slice(-1) !== '\n') s = '\n' + s

    return 'riot.tag2(\'' + name + "'" + c + q(html) + c + q(css) + c + q(attrs) +
           ', function(opts) {\n' + js + s
  }

  function extend(obj, props) {
    for (var prop in props) {
      /* istanbul ignore next */
      if (props.hasOwnProperty(prop)) {
        obj[prop] = props[prop]
      }
    }
    return obj
  }

  function parseAttrs(str, pcex) {
    var
      list = [],
      match,
      k, v,
      _bp = pcex._bp,
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
    var _bp = pcex._bp

    if (html && _bp[4].test(html)) {
      var
        jsfn = opts.expr && (opts.parser || opts.type) ? _compileJS : 0,
        list = brackets.split(html, 0, _bp),
        expr

      for (var i = 1; i < list.length; i += 2) {
        expr = list[i]
        if (expr[0] === '^')
          expr = expr.slice(1)
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

  function restoreExpr(html, pcex) {
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
    HTML_COMMENT = /<!--(?!>)[\S\s]*?-->/g,
    HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g,
    PRE_TAG = _regEx(
      /<pre(?:\s+[^'">]+(?:(?:@Q)[^'">]*)*|\s*)?>([\S\s]*?)<\/pre\s*>/
      .source.replace('@Q', brackets.R_STRINGS.source), 'gi')

  function _compileHTML(html, opts, pcex) {

    html = splitHtml(html, opts, pcex)
      .replace(HTML_TAGS, function (_, name, attr, ends) {

        name = name.toLowerCase()

        ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''

        if (attr) name += ' ' + parseAttrs(attr, pcex)

        return '<' + name + ends + '>'
      })

    if (!opts.whitespace) {
      if (/<pre[\s>]/.test(html)) {
        var p = []
        html = html.replace(PRE_TAG, function (q)
          { return p.push(q) && '\u0002' }).trim().replace(/\s+/g, ' ')
        // istanbul ignore else
        if (p.length)
          html = html.replace(/\u0002/g, function (_) { return p.shift() })
      }
      else
        html = html.trim().replace(/\s+/g, ' ')
    }

    if (opts.compact) html = html.replace(/> <([-\w\/])/g, '><$1')

    return restoreExpr(html, pcex)
  }

  // istanbul ignore next
  function compileHTML(html, opts, pcex) {
    if (Array.isArray(opts)) {
      pcex = opts
      opts = {}
    }
    else {
      if (!pcex) pcex = []
      if (!opts) opts = {}
    }

    if (!pcex.__intflag)
      html = html.replace(/\r\n?/g, '\n').replace(HTML_COMMENT, '').replace(TRIM_TRAIL, '')

    if (!pcex._bp) pcex._bp = brackets.array(opts.brackets)

    return _compileHTML(html, opts, pcex)
  }

  var
    JS_RMCOMMS = _regEx('(' + brackets.S_QBLOCKS + ')|' + brackets.R_MLCOMMS.source + '|//[^\r\n]*', 'g'),
    JS_ES6SIGN = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m

  function riotjs(js) {
    var
      match,
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
      var
        re = _regEx('([{}])|' + brackets.S_QBLOCKS, 'g'),
        level = 1,
        match

      while (level && (match = re.exec(str))) {
        if (match[1])
          match[1] === '{' ? ++level : --level
      }
      return level ? str.length : re.lastIndex
    }
  }

  function _compileJS(js, opts, type, parserOpts, url) {
    if (!js) return ''
    if (!type) type = opts.type

    var parser = opts.parser || (type ? parsers.js[type] : riotjs)
    if (!parser)
      throw new Error('JS parser not found: "' + type + '"')

    return parser(js, parserOpts, url).replace(TRIM_TRAIL, '')
  }

  // istanbul ignore next
  function compileJS(js, opts, type, extra) {
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

  var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + brackets.R_STRINGS.source, 'g')

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

  function _compileCSS(style, tag, type, opts) {
    var scoped = (opts || (opts = {})).scoped

    if (type) {
      if (type === 'scoped-css') {
        scoped = true
      }
      else if (parsers.css[type]) {
        style = parsers.css[type](tag, style, opts.parserOpts, opts.url)
      }
      else if (type !== 'css') {
        throw new Error('CSS parser not found: "' + type + '"')
      }
    }

    style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

    if (scoped) {
      // istanbul ignore next
      if (!tag)
        throw new Error('Can not parse scoped CSS without a tagName')
      style = scopedCSS(tag, style)
    }
    return style
  }

  // istanbul ignore next
  function compileCSS(style, parser, opts) {
    if (typeof parser === 'object') {
      opts = parser
      parser = ''
    }
    else if (!opts) opts = {}
    return _compileCSS(style, opts.tagName, parser, opts)
  }

  var
    TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,
    MISC_ATTR = /\s*=\s*("(?:\\[\S\s]|[^"\\]*)*"|'(?:\\[\S\s]|[^'\\]*)*'|\{[^}]+}|\S+)/.source

  function getType(str) {

    if (str) {
      var match = str.match(TYPE_ATTR)
      str = match && (match[2] || match[3])
    }
    return str ? str.replace('text/', '') : ''
  }

  function getAttr(str, name) {

    if (str) {
      var
        re = _regEx('\\s' + name + MISC_ATTR, 'i'),
        match = str.match(re)
      str = match && match[1]
      if (str)
        return (/^['"]/).test(str) ? str.slice(1, -1) : str
    }
    return ''
  }

  function getParserOptions(attrs) {
    var opts = getAttr(attrs, 'options')

    if (opts) opts = JSON.parse(opts)
    return opts
  }

  function getCode(code, opts, attrs, url) {
    var type = getType(attrs),
      parserOpts = getParserOptions(attrs)

    return _compileJS(code, opts, type, parserOpts, url)
  }

  var END_TAGS = /\/>\n|^<(?:\/[\w\-]+\s*|[\w\-]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/

  function splitBlocks(str) {
    var k, m

    /* istanbul ignore next: this if() can't be true, but just in case... */
    if (str[str.length - 1] === '>') return [str, '']

    k = str.lastIndexOf('<')
    while (~k) {
      if (m = str.slice(k).match(END_TAGS)) {
        k += m.index + m[0].length
        return [str.slice(0, k), str.slice(k)]
      }
      k = str.lastIndexOf('<', k -1)
    }
    return ['', str]
  }

  function compileTemplate(html, url, lang, opts) {
    var parser = parsers.html[lang]

    if (!parser)
      throw new Error('Template parser not found: "' + lang + '"')

    return parser(html, opts, url)
  }

  var
    CUST_TAG = _regEx(
      /^([ \t]*)<([-\w]+)(?:\s+([^'"\/>]+(?:(?:@Q|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/
      .source.replace('@Q', brackets.R_STRINGS.source), 'gim'),
    STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
    SCRIPT = _regEx(STYLE.source.replace(/tyle/g, 'cript'), 'gi')

  function compile(src, opts, url) {
    var
      parts = [],
      exclude

    if (!opts) opts = {}

    exclude = opts.exclude || false
    function included(s) { return !(exclude && ~exclude.indexOf(s)) }

    var _bp = brackets.array(opts.brackets)

    if (opts.template)
      src = compileTemplate(src, url, opts.template, opts.templateOptions)

    src = src
      .replace(/\r\n?/g, '\n')
      .replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {

        var
          jscode = '',
          styles = '',
          html = '',
          pcex = []

        pcex._bp = _bp
        pcex.__intflag = 1

        tagName = tagName.toLowerCase()

        attribs = attribs && included('attribs') ?
          restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex), pcex), pcex) : ''

        if (body2) body = body2

        if (body && (body = body.replace(HTML_COMMENT, '')) && /\S/.test(body)) {

          if (body2) {
            /* istanbul ignore next */
            html = included('html') ? _compileHTML(body2, opts, pcex) : ''
          }
          else {
            body = body.replace(_regEx('^' + indent, 'gm'), '')

            body = body.replace(STYLE, included('css') ? function (_, _attrs, _style) {
              var extraOpts = {
                scoped: _attrs && /\sscoped(\s|=|$)/i.test(_attrs),
                url: url,
                parserOpts: getParserOptions(_attrs)
              }
              styles += (styles ? ' ' : '') +
                _compileCSS(_style, tagName, getType(_attrs) || opts.style, extraOpts)
              return ''
            } : '')

            body = body.replace(SCRIPT, included('js') ? function (_, _attrs, _script) {
              jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
              return ''
            } : '')

            var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''))

            if (included('html')) {
              body = blocks[0]
              if (body)
                html = _compileHTML(body, opts, pcex)
            }

            if (included('js')) {
              body = blocks[1]
              if (/\S/.test(body))
                jscode += (jscode ? '\n' : '') + _compileJS(body, opts, null, null, url)
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

    return src
  }

  riot.util.compiler = {
    compile: compile,
    html: compileHTML,
    css: compileCSS,
    js: compileJS,
    version: 'v2.3.19'
  }
  return compile

})()
