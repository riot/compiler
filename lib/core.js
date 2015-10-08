//# The riot Compiler
//-------------------

var
  // Boolean attributes, prefixed with `__` in the riot tag definition.
  // See:
  //    http://www.w3.org/TR/html5/infrastructure.html#boolean-attributes
  //    http://w3c.github.io/html-reference/global-attributes.html
  //    http://javascript.info/tutorial/attributes-and-custom-properties
  //
  //  Looks like, in [jsperf tests](http://jsperf.com/riot-regexp-test-vs-array-indexof),
  //  RegExp is faster in most browsers, except for very shorty arrays.
  /*
    http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
    https://validator.w3.org/nu
    All time and globals
      disabled
      checked
      readonly
      ismap
      reversed - <ol>
      selected
    New html5 attributes
      autofocus
      formnovalidate
      hidden
      inert
      multiple
      novalidate
      required
      typemustmatch
      default - <menuitem> (not yet supported by browsers)
      open - <details>/<dialog>
      sortable - html 5.1
    Microdata (html5)
      itemscope
    Not supported in html5
      allowfullscreen - <iframe>
      seamless - <iframe>
      noresize - <frame>
      noshade - <hr> (obsolete)
      nohref - <area>
      nowrap - <td>
      compact - <ol>/<ul>/<dir>
      truespeed - <marquee> attr not supported by Chrome/Opera
    Only for the <video> element:
    https://www.w3.org/wiki/HTML/Elements/audio
      autoplay
      controls
      loop
      default - <track>
      muted

    Removed from BOOL_ATTR:
      async -- <script> riot does not handle this
      defer -- <script> riot does not handle this, only IE8+ honors this attribute
      defaultChecked|Muted|Selected -- they are properties, not attributes
      draggable -- not boolean, this is an enumerated attribute: true|false|auto
      spellcheck -- not boolean, this is an enumerated attribute: true|false
      translate -- not boolean, this is an enumerated attribute: yes|no
      declare - <object> unuseful in main browsers
      indeterminate - boolean attr, but can't be set with markup
      pauseonexit - <track> not for markup, or it is too complex
      enabled - I can't find any "enabled" attribute in the html specs
      visible - I can't find any "visible" attribute in the html specs
  */
  BOOL_ATTR = regEx(
    '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
    'compact|controls|default|formnovalidate|hidden|inert|ismap|itemscope|loop|' +
    'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
    'selected|sortable|truespeed|typemustmatch)$'),

  // HTML5 void elements that cannot be auto-closed.
  // See: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
  //      http://www.w3.org/TR/html5/syntax.html#void-elements
  VOID_TAGS = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,

  // The following attributes give error when parsed on browser with `{ exrp_value }`.
  // `d` describes the SVG <path>, Chrome gives error if the value has invalid format.
  // See: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  //RIOT_ATTR = ['style', 'src', 'd'],

  // Matches attributes. Names can contain almost all iso-8859-1 character set.
  HTML_ATTR = /\s*([-\w:\.\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g

//#define $_RIX_TEST  4
//#ifndef $_RIX_TEST
var
  $_RIX_TEST = 4
//#endif

//#define $_HIDEXPR_MARK '\u0001'
//#define $_HIDEXPR_REPL /\u0001(\d+)(?=#})/g
//#define $_HIDEXPR_TEST /\u0001\d/
//#ifndef $_HIDEXPR_MARK
var
  // REMEMBER EDIT THE #defines TOO!!!
  $_HIDEXPR_MARK = '\u0001',
  $_HIDEXPR_REPL = /\u0001(\d+)(?=#})/g,
  $_HIDEXPR_TEST = /\u0001\d/
//#endif

function q(s) {
  return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/(^|[^\\])'/g, "$1\\'") : '') + "'"
}

// Generates the `riot.tag2` call with the processed parts.
function mktag(name, html, css, attrs, js) {
  var c = ', ', s = '});'

  // to determine the line spacing in tests, if we have js code, one empty line
  // at top if the source contains almost one, and the same for the bottom.
  // no empty lines if no code
  if (js) {
    var n = js.search(/[^\n]/)      // preserve indentation
    if (n < 0)
      js = ''                       // no code, or whitespace only
    else {
      if (n > 1) js = js.slice(n - 1)
      js = js.replace(/\n{3,}/g, '\n\n')
      if (js.slice(-1) !== '\n') s = '\n' + s
    }
  }
  return 'riot.tag2(' + q(name) + c + q(html) + c + q(css) + c + q(attrs) +
         ', function(opts) {\n' + js + s
}

/**
 * Parses and format attributes.
 *
 * @param   {string} str - Attributes, with expressions replaced by their hash
 * @returns {string} Formated attributes
 */
function parseAttrs(str) {
  var list = [],
      match,
      k, v,
      dq = '"'
  HTML_ATTR.lastIndex = 0

  while (match = HTML_ATTR.exec(str)) {

    // all attribute names are converted to lower case
    k = match[1].toLowerCase()
    v = match[2]
    if (!v)
      list.push(k)          // boolean attribute without explicit value
    else {

      // attribute values must be enclosed in double quotes
      if (v[0] !== dq)
        v = dq + (v[0] === "'" ? v.slice(1, -1) : v) + dq

      if (k === 'type' && v.toLowerCase() === '"number"') {
        v = dq + brackets.E_NUMBER + dq   // fix #827 by @rsbondi
      }
      else if ($_HIDEXPR_TEST.test(v)) {
        // renames special attributes with expressiones in their value.
        if (BOOL_ATTR.test(k)) k = '__' + k
        else if (k === 'style' || k === 'src' || k === 'd') k = 'riot-' + k
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
  if (html && opts._b[$_RIX_TEST].test(html)) {
    var
      jsfn = opts.expr && (opts.parser || opts.type) ? compileJS : 0,
      list = brackets.split(html, opts._b),
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
      list[i] = $_HIDEXPR_MARK + (pcex.push(expr.trim()) - 1) + '#}'
    }
    html = list.join('')
  }
  // escape '{#' here, before relacing type="number"
  return ~html.indexOf('#') ? html.replace(/\{#/g, '\\{#') : html
}

// Restores expressions hidden by splitHtml and escape literal internal brackets
function restoreExpr(html, pcex) {
  if (pcex.length)
    html = html
      .replace($_HIDEXPR_REPL, function (_, d) {
        return '{#' + pcex[d].replace(/"/g, '&quot;')
      })
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
 * @param   {Object} opts   - Collected user options. Includes the brackets array in `_b`
 * @param   {Array}  [pcex] - Keeps precompiled expressions
 * @returns {string} The parsed HTML text
 * @see http://www.w3.org/TR/html5/syntax.html
 */
function compileHTML(html, opts, pcex) {

  // `opts._b`is undefined when `compileHTML` is called from tests
  if (!opts._b) {
    opts._b = brackets.array(opts.brackets)
    html = html.replace(HTML_COMMENT, '').replace(/[ \t]+$/gm, '')
  }
  if (!html) return ''
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


//## JavaScript Compilation
//-------------------------

var
    // Prepare regexp for remotion of multiline and single-line comments
    JS_RMCOMMS = regEx(
    '(' + regEx.S_QBSRC + ')|' + regEx.MLCOMMS.source + '|//[^\r\n]*',
    'g'),
    // Matches es6 methods across multiple lines up to their first curly brace
    JS_ES6SIGN = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m

// Default parser for JavaScript code
function riotjs(js) {
  var match,
      toes5,
      parts = [],   // parsed code
      pos,
      GRE = RegExp

  // remove comments and trim trailing whitespace
  js = js
      .replace(JS_RMCOMMS, function (m, q) { return q ? m : ' ' })
      .replace(/[ \t]+$/gm, '')

  // $1: indentation,
  // $2: method name,
  // $3: parameters
  while (match = js.match(JS_ES6SIGN)) {

    // save remaining part now -- IE9 changes `rightContext` in `RegExp.test`
    parts.push(GRE.leftContext)
    js = GRE.rightContext

    pos = skipBlock(js)           // find the closing bracket
    if (pos < 0) {
      js = match[0] + js
      break                       // something bad happened
    }

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
    var re = regEx('([{}])|' + regEx.S_QBSRC, 'g'),
        level = 1,
        match

    while (level && (match = re.exec(str))) {
      if (match[1])
        match[1] === '{' ? ++level : --level
    }
    return level ? -1 : re.lastIndex
  }
}

/**
 * Runs the parser for the JavaScript code, defaults to `riotjs`
 *
 * @param   {string} js     - Buffer with the javascript code
 * @param   {Object} opts   - Options, can include a custom parser function
 * @param   {string} [type] - Optional type for parser selection
 * @returns {string} The parsed JavaScript code
 */
function compileJS(js, opts, type) {

  if (!js) return ''
  if (!type) type = opts.type

  var parser = opts.parser || (type ? parsers.js[type] : riotjs)
  if (!parser)
    throw new Error('JS parser not found: "' + type + '"')

  return parser(js, opts)
}


//## CSS Compilation
//------------------
// See http://www.w3.org/TR/CSS21/

// Prepare regex to match CSS selectors, excluding those beginning with '@'.
var CSS_SELECTOR = regEx('(}|{|^)[ ;]*([^@ ;][^{}]*)(?={)|' + regEx.STRINGS.source, 'g')

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
 * @returns {string} The processed style block
 */
function compileCSS(style, tag, type, scoped) {

  if (type) {
    if (type === 'scoped-css') {    // DEPRECATED
      scoped = true
    }
    else if (parsers.css[type]) {
      style = parsers.css[type](tag, style)
    }
    else if (type !== 'css') {
      throw new Error('CSS parser not found: "' + type + '"')
    }
  }

  // remove comments, compact and trim whitespace
  style = style.replace(regEx.MLCOMMS, '').replace(/\s+/g, ' ').trim()

  // translate scoped rules if nedded
  return scoped ? scopedCSS(tag, style) : style
}


//## The main compiler
//--------------------

// Matches the 'type' attribute, for script and style tags
var TYPE_ATTR = /\stype\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i

//#if RIOT_CLI
// Returns the value of any attribute, or the empty string for missing attribute.
function getAttr(str, name) {

  if (str) {
    var re = regEx(TYPE_ATTR.source.replace('type', name), 'i'),
        match = str && str.match(re)
    str = match && (match[1] || match[2])
  }
  return str || ''
}
//#endif

// Returns the value of the 'type' attribute, with the prefix "text/" removed.
function getType(str) {

  if (str) {
    var match = str.match(TYPE_ATTR)
    str = match && (match[1] || match[2])
  }
  return str ? str.replace('text/', '') : ''
}

// Runs the custom or default parser on the received JavaScript code.
// CLI version can read code from the file system.
function getCode(code, opts, attrs, url) {
  var type = getType(attrs)

  //#if RIOT_CLI
  var src = getAttr(attrs, 'src')
  if (src) {
    var chset = getAttr(attrs, 'charset'),
        path = require('path'),
        fs = require('fs'),
        f = path.resolve(url || opts.basedir || '.', src)
    code = fs.readFileSync(f, { encoding: chset || 'utf8' })
  }
  //#endif

  code = compileJS(code, opts, type)

  //#if RIOT_CLI
  if (src)
    return '// src: ' + path.relative('.', src).replace(/\\/g, '/') + '\n' + code
  //#endif
  return code
}

// Matches HTML tag ending a line. This regex still can be fooled by code as:
// ```js
// x <y && y >
//  z
// ```
var LAST_TAG = /<(?:\/[-\w]+\s*|[-\w]+(?:\s*\/?|\s+[^'">]*(?:(?:"[^"]*"|'[^']*')[^'">]*)*))>\n/

// Returns the position where the untagged script block starts.
function findScript(str) {
  var i = str.length

  // detect empty js block here
  if (/>\s*$/.test(str)) return i

  // search the last line ending with '>'
  do {
    if ((i = str.lastIndexOf('>', i - 1)) < 0) {
      return i
    }
  } while (str[i + 1] !== '\n')

  // with `/>` we can be almost certain that this line closes the HTML block
  if (str[i - 1] === '/') return i + 1

  // not sure, starting from the last '>' backward search for a closing tag
  str = str.slice(0, i + 2)   // include the '\n'
  do {
    i = str.lastIndexOf('>', i - 1)
    if (match = str.slice(i + 1).match(LAST_TAG)) {
      return i + match.index + match[0].length + 1
    }
  } while (i > 0)

  return -1   // html not found
}

// Runs the external HTML parser for the entire tag file
function compileTemplate(lang, html) {
  var parser = parsers.html[lang]

  if (!parser)
    throw new Error('Template parser not found: "' + lang + '"')

  return parser(html)
}

// CUST_TAG regex don't allow unquoted expressions containing the `>` operator.
// STYLE and SCRIPT disallows the operator `>` at all.
var
  CUST_TAG = /^[ \t]*<([-\w]+)\s*([^'"\/>]*(?:(?:\/[^>]|"[^"]*"|'[^']*')[^'"\/>]*)*)(?:\/|>\n?([^<]*(?:<(?!\/\1\s*>[ \t]*$)[^<]*)*)<\/\1\s*)>[ \t]*$/gim,
  STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
  SCRIPT = regEx(STYLE.source.replace(/tyle/g, 'cript'), 'gi')

/**
 * The main compiler processes all custom tags, one by one.
 *
 * In .tag files, a custom tag can span multiple lines, but there should be no other
 * external element sharing the starting and ending lines of the tag (HTML comments
 * inclusive). Custom tags in HTML files don't have this restriction.
 *
 * @param   {string} src    - String with zero or more custom riot tags.
 * @param   {Object} [opts] - User options.
 * @param   {string} [url]  - Filename of the riot tag, prepended to the generated code.
 * @returns {string} JavaScript code to build the tag later, through riot.tag2 function.
 */
function compile(src, opts, url) {

  if (!opts) opts = {}

  // get a static brackets array for use on the entire source
  opts._b = brackets.array(opts.brackets)

  // run any custom html parser before the compilation
  if (opts.template)
    src = compileTemplate(opts.template, src)

  // normalize eols and start processing the tags
  return src
    .replace(/\r\n?/g, '\n')
    .replace(CUST_TAG, function (_, tagName, attribs, content) {

      // content can have attributes first, then html markup with zero or more script or
      // style tags of different types, and finish with an untagged block of javascript code.
      var jscode = '',
          styles = '',
          html = '',
          pcex = []

      tagName = tagName.toLowerCase()

      // process the attributes, including their expressions
      if (attribs)
        attribs = restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex)), pcex)

      // remove comments and trim trailing whitespace
      content = content &&
                content.replace(HTML_COMMENT, '').replace(/[ \t]+$/gm, '')
      if (content) {

        // get the style blocks
        content = content.replace(STYLE, function (_, _attrs, _style) {
          var scoped = _attrs && /\sscoped(\s|=|$)/i.test(_attrs)
          styles += (styles ? ' ' : '') +
            compileCSS(_style, tagName, getType(_attrs), scoped)
          return ''
        })

        // separate script blocks from the html
        content = content.replace(SCRIPT, function (_, _attrs, _script) {
          jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
          return ''
        })

        // find and process the html markup
        var jspos = findScript(content)
        if (~jspos) {
          html = compileHTML(content.slice(0, jspos), opts, pcex)
          content = content.slice(jspos)
        }

        // the remaining part is untagged js code
        if (/\S/.test(content))
          jscode += (jscode ? '\n' : '') + compileJS(content, opts)
      }

      // create the comment to prepend, with the full url info
      url = url ? '// ' + url + '\n' : ''

      // replace the tag with a call to the riot.tag2 function and we are done
      return url + mktag(tagName, html, styles, attribs, jscode, pcex)
    })
}
