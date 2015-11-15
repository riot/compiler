/**
 * @module compiler
 */
//#if RIOT
var compile = (function () {

  var brackets = riot.util.brackets
//#else
//#define READ_JS_SRC

  var brackets = _tmpl.brackets   //eslint-disable-line no-redeclare
//#endif

  function _regEx(str, opt) { return new RegExp(str, opt) }

  //  Looks like, in [jsperf tests](http://jsperf.com/riot-regexp-test-vs-array-indexof)
  //  RegExp is faster in most browsers, except for very shorty arrays.
  var
    // Boolean attributes, prefixed with `__` in the riot tag definition.
    // See ../doc/attributes.md
    //
    BOOL_ATTRS = _regEx(
      '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
      'compact|controls|default|formnovalidate|hidden|inert|ismap|itemscope|loop|' +
      'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
      'selected|sortable|truespeed|typemustmatch)$'),

    // The following attributes give error when parsed on browser with `{ exrp_value }`
    // See ../doc/attributes.md
    RIOT_ATTRS = ['style', 'src', 'd'],

    // HTML5 void elements that cannot be auto-closed.
    // See: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
    //      http://www.w3.org/TR/html5/syntax.html#void-elements
    VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,

    // Matches attributes. Names can contain almost all iso-8859-1 character set.
    HTML_ATTR  = /\s*([-\w:\.\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g,

    TRIM_TRAIL = /[ \t]+$/gm,

    _bp = null

  //#if NODE
  var path = require('path')
  //#endif

  //#set $_RIX_TEST  = 4
  //#set $_RIX_ESC   = 5
  //#set $_RIX_OPEN  = 6
  //#set $_RIX_CLOSE = 7
  //#set $_RIX_PAIR  = 8
  //#ifndef $_RIX_TEST
  var
    $_RIX_TEST  = 4,  // DONT'T FORGET SYNC THE #set BLOCK!!!
    $_RIX_ESC   = 5,
    $_RIX_OPEN  = 6,
    $_RIX_CLOSE = 7,
    $_RIX_PAIR  = 8
  //#endif

  // Escape backslashes and inner single quotes, and enclose s in single quotes
  function q(s) {
    //return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/(^|[^\\])'/g, "$1\\'") : '') + "'"
    return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '') + "'"
  }

  // Generates the `riot.tag2` call with the processed parts.
  function mktag(name, html, css, attrs, js, pcex) {
    var
      c = ', ',
      s = '}' + (pcex.length ? ', ' + q(_bp[$_RIX_PAIR]) : '') + ');'

    // give more consistency to the output
    if (js && js.slice(-1) !== '\n') s = '\n' + s

    return 'riot.tag2(' + q(name) + c + q(html) + c + q(css) + c + q(attrs) +
           ', function(opts) {\n' + js + s
  }

  /**
   * Merge two javascript object extending the properties of the first one with
   * the second
   * @param   {object} obj - source object
   * @param   {object} props - extra properties
   * @returns {object} source object containing the new properties
   */
  function extend(obj, props) {
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        obj[prop] = props[prop]
      }
    }
    return obj
  }

  /**
   * Parses and format attributes.
   *
   * @param   {string} str - Attributes, with expressions replaced by their hash
   * @returns {string} Formated attributes
   */
  function parseAttrs(str) {
    var
      list = [],
      match,
      k, v,
      DQ = '"'
    HTML_ATTR.lastIndex = 0

    while (match = HTML_ATTR.exec(str)) {

      // all attribute names are converted to lower case
      k = match[1].toLowerCase()
      v = match[2]

      if (!v) {
        list.push(k)          // boolean attribute without explicit value
      }
      else {

        // attribute values must be enclosed in double quotes
        if (v[0] !== DQ)
          v = DQ + (v[0] === "'" ? v.slice(1, -1) : v) + DQ

        if (k === 'type' && v.toLowerCase() === '"number"') {
          v = DQ + _bp[0] + "'number'" + _bp[1] + DQ   // fix #827 by @rsbondi
        }
        else if (/\u0001\d/.test(v)) {
          // renames special attributes with expressiones in their value.
          if (BOOL_ATTRS.test(k)) {
            k = '__' + k
          }
          else if (~RIOT_ATTRS.indexOf(k)) {
            k = 'riot-' + k
          }
        }

        // join the key-value pair, with no spaces between the parts
        list.push(k + '=' + v)
      }
    }
    return list.join(' ')     // returns the attribute list
  }

  // Replaces expressions in the HTML with a marker, and runs expressions
  // through the parser, except those beginning with `{^`.
  function splitHtml(html, opts, pcex) {

    // `brackets.split` is a heavy function, so don't call it if not necessary
    if (html && _bp[$_RIX_TEST].test(html)) {
      var
        jsfn = opts.expr && (opts.parser || opts.type) ? compileJS : 0,
        list = brackets.split(html),
        expr

      for (var i = 1; i < list.length; i += 2) {
        expr = list[i]
        if (expr[0] === '^')
          expr = expr.slice(1)
        else if (jsfn) {
          expr = jsfn(expr, opts)
          if (/;\s*$/.test(expr)) expr = expr.slice(0, expr.search(/;\s*$/))
        }
        list[i] = '\u0001' + (pcex.push(expr.replace(/[\r\n]+/g, ' ').trim()) - 1) + _bp[1]
      }
      html = list.join('')
    }
    return html
  }

  // Restores expressions hidden by splitHtml and escape literal internal brackets
  function restoreExpr(html, pcex) {
    if (pcex.length) {
      html = html
        .replace(/\u0001(\d+)/g, function (_, d) {
          return _bp[0] + pcex[d].replace(/"/g, '&quot;')
        })
    }
    return html
  }


  //## HTML Compilation
  //-------------------

  // `HTML_TAGS` matches only start and self-closing tags, not the content.
  var
    HTML_COMMENT = /<!--(?!>)[\S\s]*?-->/g,
    HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g

  /**
   * Parses and formats the HTML text.
   *
   * @param   {string} html   - Can contain embedded HTML comments and literal whitespace
   * @param   {Object} opts   - Collected user options. Includes the brackets array in `_bp`
   * @param   {Array}  [pcex] - Keeps precompiled expressions
   * @param   {number} [intc] - 1 if internal call
   * @returns {string} The parsed HTML text
   * @see http://www.w3.org/TR/html5/syntax.html
   */
  function compileHTML(html, opts, pcex, intc) {

    // `_bp`is undefined when `compileHTML` is called from tests
    if (!intc) {
      _bp = brackets.array(opts.brackets)
      html = html.replace(HTML_COMMENT, '').replace(TRIM_TRAIL, '')
    }
    if (!pcex) pcex = []

    // separate the expressions, then parse the tags and their attributes
    html = splitHtml(html, opts, pcex)
      .replace(HTML_TAGS, function (_, name, attr, ends) {
        // force all tag names to lowercase
        name = name.toLowerCase()
        // close self-closing tag, except if this is a html5 void tag
        ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''
        // format the attributes
        if (attr) name += ' ' + parseAttrs(attr)

        return '<' + name + ends + '>'
      })

    // tags parsed, now compact whitespace, or preserve if `opts.whitespace` is set
    html = opts.whitespace ?
           html.replace(/\r\n?|\n/g, '\\n') : html.trim().replace(/\s+/g, ' ')

    // for `opts.compact`, remove whitespace between tags
    if (opts.compact) html = html.replace(/> <([-\w\/])/g, '><$1')

    return restoreExpr(html, pcex)
  }


  // JavaScript Compilation
  // ----------------------

  var
    // Prepare regexp for remotion of multiline and single-line comments
    JS_RMCOMMS = _regEx(
    '(' + brackets.S_QBLOCKS + ')|' + brackets.R_MLCOMMS.source + '|//[^\r\n]*',
    'g'),
    // Matches es6 methods across multiple lines up to their first curly brace
    JS_ES6SIGN = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m

  // Default parser for JavaScript code
  function riotjs(js) {
    var
      match,
      toes5,
      parts = [],   // parsed code
      pos

    // remove comments
    js = js.replace(JS_RMCOMMS, function (m, q) { return q ? m : ' ' })

    // $1: indentation,
    // $2: method name,
    // $3: parameters
    while (match = js.match(JS_ES6SIGN)) {

      // save remaining part now -- IE9 changes `rightContext` in `RegExp.test`
      parts.push(RegExp.leftContext)
      js  = RegExp.rightContext
      pos = skipBlock(js)           // find the closing bracket

      // convert ES6 method signature to ES5 function
      toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(match[2])
      if (toes5)
        match[0] = match[1] + 'this.' + match[2] + ' = function' + match[3]

      parts.push(match[0], js.slice(0, pos))
      js = js.slice(pos)
      if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
    }

    return parts.length ? parts.join('') + js : js

    // Inner helper - find the position following the closing bracket for the current block
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

  /**
   * Runs the parser for the JavaScript code, defaults to `riotjs`
   *
   * @param   {string} js     - Buffer with the javascript code
   * @param   {Object} opts   - Options, can include a custom parser function
   * @param   {string} type - Optional type for parser selection
   * @param   {Object} parserOpts - Optional parser options
   * @returns {string} The parsed JavaScript code
   */
  function compileJS(js, opts, type, parserOpts) {
    if (!js) return ''
    if (!type) type = opts.type

    var parser = opts.parser || (type ? parsers.js[type] : riotjs)
    if (!parser)
      throw new Error('JS parser not found: "' + type + '"')

    return parser(js, parserOpts).replace(TRIM_TRAIL, '')
  }


  // CSS Compilation
  // ----------------
  // See http://www.w3.org/TR/CSS21/

  // Prepare regex to match CSS selectors, excluding those beginning with '@'.
  var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;][^{}]*)(?={)|' + brackets.R_STRINGS.source, 'g')

  // Parses styles enclosed in a "scoped" tag (`scoped` is deprecated in HTML5).
  // The "style" string is received without comments or surrounding spaces.
  function scopedCSS(tag, style) {
    var scope = ':scope'

    return style.replace(CSS_SELECTOR, function (m, p1, p2) {
      // skip quoted strings
      if (!p2) return m

      // we have a selector list, parse each individually
      p2 = p2.replace(/[^,]+/g, function (sel) {
        var s = sel.trim()
        // skips the keywords and percents of css animations
        if (s && s !== 'from' && s !== 'to' && s.slice(-1) !== '%') {
          // replace the `:scope` pseudo-selector, where it is, with the root tag name;
          // if `:scope` was not included, add the tag name as prefix, and mirror all
          // to `[riot-tag]`
          if (s.indexOf(scope) < 0) s = scope + ' ' + s
          s = s.replace(scope, tag) + ',' +
              s.replace(scope, '[riot-tag="' + tag + '"]')
        }
        return sel.slice(-1) === ' ' ? s + ' ' : s // respect (a little) the user style
      })
      // add the danling bracket char and return the processed selector list
      return p1 ? p1 + ' ' + p2 : p2
    })
  }

  /**
   * Runs the parser for style blocks.
   * For scoped styles, the `scopedCSS` function is called after any external parser.
   *
   * @param   {string}  style    - Raw style block
   * @param   {string}  tag      - The root tag name to which the style belongs
   * @param   {string}  [type]   - One of `parsers.css`: jade, stylus, etc.
   * @param   {boolean} [scoped] - `true` for scoped styles
   * @param   {object} opts      - get the custom parser options
   * @returns {string} The processed style block
   */
  function compileCSS(style, tag, type, scoped, opts) {

    if (type) {
      if (type === 'scoped-css') {    // DEPRECATED
        scoped = true
      }
      else if (parsers.css[type]) {
        style = parsers.css[type](tag, style, opts)
      }
      else if (type !== 'css') {
        throw new Error('CSS parser not found: "' + type + '"')
      }
    }

    // remove comments, compact and trim whitespace
    style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

    // translate scoped rules if nedded
    return scoped ? scopedCSS(tag, style) : style
  }


  // The main compiler
  // -----------------

  // Matches the 'type' attribute, for script and style tags
  var
    TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,  // don't handle escaped quotes :(
    MISC_ATTR = /\s*=\s*("(?:\\[\S\s]|[^"\\]*)*"|'(?:\\[\S\s]|[^'\\]*)*'|\{[^}]+}|\S+)/.source

  // Returns the value of the 'type' attribute, with the prefix "text/" removed.
  function getType(str) {

    if (str) {
      var match = str.match(TYPE_ATTR)
      str = match && (match[2] || match[3])
    }
    return str ? str.replace('text/', '') : ''
  }


  // Returns the value of any attribute, or the empty string for missing attribute.
  function getAttr(str, name) {

    if (str) {
      var
        re = _regEx('\\s' + name + MISC_ATTR, 'i'),
        match = str.match(re)
      str = match && match[1]
      if (str)
        return /^['"]/.test(str) ? str.slice(1, -1) : str
    }
    return ''
  }

  // get the parser options from the options attribute
  function getParserOptions(attrs) {
    var opts = getAttr(attrs, 'options')
    // convert the string into a valid js object
    if (opts) opts = JSON.parse(opts)
    return opts
  }

  // Runs the custom or default parser on the received JavaScript code.
  // The CLI version can read code from the file system (experimental)
  function getCode(code, opts, attrs, url) {
    var type = getType(attrs),
      parserOpts = getParserOptions(attrs)

    //#if READ_JS_SRC
    var src = getAttr(attrs, 'src')
    if (src && url) {
      var
        charset = getAttr(attrs, 'charset'),
        file = path.resolve(path.dirname(url), src)
      code = require('fs').readFileSync(file, {encoding: charset || 'utf8'})
    }
    //#endif
    return compileJS(code, opts, type, parserOpts)
  }

  // Matches HTML tag ending a line. This regex still can be fooled by code as:
  // ```js
  // x <y && y >
  //  z
  // ```
  var END_TAGS = /\/>\n|^<(?:\/[\w\-]+\s*|[\w\-]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/

  function splitBlocks(str) {
    var k, m

    /* istanbul ignore next: this if() can't be true, but just in case... */
    if (str[str.length - 1] === '>')
      return [str, '']

    k = str.lastIndexOf('<')    // first probable open tag
    while (~k) {
      if (m = str.slice(k).match(END_TAGS)) {
        k += m.index + m[0].length
        return [str.slice(0, k), str.slice(k)]
      }
      k = str.lastIndexOf('<', k -1)
    }

    return ['', str]
  }

  // Runs the external HTML parser for the entire tag file
  function compileTemplate(lang, html, opts) {
    var parser = parsers.html[lang]

    if (!parser)
      throw new Error('Template parser not found: "' + lang + '"')

    return parser(html, opts)
  }

  /*
    CUST_TAG regex don't allow unquoted expressions containing the `>` operator.
    STYLE and SCRIPT disallows the operator `>` at all.

    The beta.4 CUST_TAG regex is fast, with RegexBuddy I get 76 steps and 14 backtracks on
    the test/specs/fixtures/treeview.tag :) but fails with nested tags of the same name :(
    With a greedy * operator, we have ~500 and 200bt, it is acceptable. So let's fix this.
   */
  var
    CUST_TAG = /^<([-\w]+)(?:\s+([^'"\/>]+(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\s\S]*)^<\/\1\s*>|>(.*)<\/\1\s*>)/gim,
    STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
    SCRIPT = _regEx(STYLE.source.replace(/tyle/g, 'cript'), 'gi')

  /**
   * The main compiler processes all custom tags, one by one.
   *
   * In .tag files, a custom tag can span multiple lines, but there should be no other
   * external element sharing the starting and ending lines of the tag (HTML comments
   * inclusive) and should not be indented.
   * Custom tags in HTML files don't have this restriction.
   *
   * @param   {string} src    - String with zero or more custom riot tags.
   * @param   {Object} [opts] - User options.
   * @param   {string} [url]  - Filename of the riot tag, prepended to the generated code.
   * @returns {string} JavaScript code to build the tag later, through riot.tag2 function.
   */
  function compile(src, opts, url) {
    var label, parts = []

    if (!opts) opts = {}

    // get a static brackets array for use on the entire source
    _bp = brackets.array(opts.brackets)

    // run any custom html parser before the compilation
    if (opts.template)
      src = compileTemplate(opts.template, src, opts.templateOptions)

    // riot #1070 -- isAbsolute does not exists in node 10.x
    //#if NODE
    /* istanbul ignore next */
    label = !url ? '' : path.isAbsolute(url) ? path.relative('.', url) : url
    if (label)
      label = '//src: ' + label.replace(/\\/g, '/') + '\n'
    //#else
    label = url ? '//src: ' + url + '\n' : ''
    //#endif

    // normalize eols and start processing the tags
    src = label + src
      .replace(/\r\n?/g, '\n')
      .replace(CUST_TAG, function (_, tagName, attribs, body, body2) {

        // content can have attributes first, then html markup with zero or more script or
        // style tags of different types, and finish with an untagged block of javascript code.
        var
          jscode = '',
          styles = '',
          html = '',
          pcex = []

        tagName = tagName.toLowerCase()

        // process the attributes, including their expressions
        attribs = !attribs ? '' :
          restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex)), pcex)

        if (body2) body = body2

        // remove comments and trim trailing whitespace
        if (body && (body = body.replace(HTML_COMMENT, '')) && /\S/.test(body)) {

          if (body2)
            html = compileHTML(body2, opts, pcex, 1)
          else {
            // get and process the style blocks
            body = body.replace(STYLE, function (_, _attrs, _style) {
              var scoped = _attrs && /\sscoped(\s|=|$)/i.test(_attrs)
              styles += (styles ? ' ' : '') +
                compileCSS(_style, tagName, getType(_attrs), scoped, getParserOptions(_attrs))
              return ''
            })

            // now the script blocks
            body = body.replace(SCRIPT, function (_, _attrs, _script) {
              //#if READ_JS_SRC
              jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
              //#else
              jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs)
              //#endif
              return ''
            })

            // separate the untagged javascript block from the html markup
            var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''))

            body = blocks[0]
            if (body)
              html = compileHTML(body, opts, pcex, 1)

            body = blocks[1]
            if (/\S/.test(body))
              jscode += (jscode ? '\n' : '') + compileJS(body, opts)
          }
        }

        // give more consistency to the output
        jscode = /\S/.test(jscode) ? jscode.replace(/\n{3,}/g, '\n\n') : ''

        // replace the tag with a call to the riot.tag2 function and we are done
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
        // replace the tag with a call to the riot.tag2 function and we are done
        return mktag(tagName, html, styles, attribs, jscode, pcex)
      })

    return opts.entities ? parts : src
  }

//#if RIOT
  return compile

})()
//#endif
