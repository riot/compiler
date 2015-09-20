
/*#
  ## The riot Compiler
  --------------------
*/
//#insert_once "./regexps"
//#if RIOT_CLI
//var tmpl = require('riot-tmpl')
//var brackets = tmpl.brackets
//#endif

var
  /*
    Boolean attributes, prefixed with `__` in the riot tag definition.
    See:
      http://www.w3.org/TR/html5/infrastructure.html#boolean-attributes
      http://stackoverflow.com/questions/706384/boolean-html-attributes
      http://w3c.github.io/html-reference/global-attributes.html
      http://javascript.info/tutorial/attributes-and-custom-properties

    Looks like RegExp is faster in most browsers, except for very shorty arrays.
    See: http://jsperf.com/riot-regexp-test-vs-array-indexof
  */
  BOOL_ATTR = regExp(
    '^(?:disabled|checked|readonly|required|allowfullscreen|async|auto(?:focus|play)|' +
    'compact|controls|declare|default(?:checked|muted|selected)?|defer|' +
    'draggable|enabled|formnovalidate|hidden|indeterminate|inert|ismap|itemscope|loop|' +
    'multiple|muted|no(?:href|resize|shade|validate|wrap)?|open|pauseonexit|reversed|' +
    'seamless|selected|sortable|spellcheck|translate|truespeed|typemustmatch|visible)$'),
  /*
    HTML5 void elements that cannot be auto-closed
    See: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
         http://www.w3.org/TR/html5/syntax.html#void-elements
  */
  VOID_TAGS = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,
  /*
    The following attributes give error when parsed on browser with `{ exrp_value }`
    'd' describes the SVG <path>, Chrome gives error if the value is not valid format.
    See: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  */
  RIOT_ATTR = ['style', 'src', 'd'],

  ID_NUMBER = '#@01#',
  RE_PCEXID = /#@\d+#/,
  GRE = RegExp

function q(s) {
  return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '') + "'"
}

/*
  Generates the riot.tag2 call with processed parts
*/
function mktag(name, html, css, attrs, js, pcex) {
  var c = ', ',
      s = 'riot.tag2(' + q(name) + c + q(html) + c + q(css) + c + q(attrs) +
          ', function(opts) {' +
          (js ? ('\n' + js + '\n').replace(/\n{4,}/g, '\n\n\n') : '\n')

  if (pcex.length)
    s += '}, {' + pcex.join(c)

  return s + '});'
}


/**
 * Format attributes.
 * - Replace the attribute name of riot special attributes
 * - Enclose the value in double quotes
 * - Joins the name-value pair with no spaces around the equal sign
 *
 * @param   { string } str - Attributes, with expressions converted to `\x01` and no closing char.
 * @returns { string } Formated attributes, with whitespace converted to compact spaces.
 */
function parseAttrs(str) {
  var
    re = /\s*([-\w:\.\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g,
    list = [],
    match,
    k, v

  // Splits each attribute in their name-value pair.
  while (match = re.exec(str)) {

    k = match[1].toLowerCase()
    v = match[2]
    if (!v)
      list.push(k)
    else {

      if (v[0] === "'" || v[0] === '"')
        v = v.slice(1, -1)

      if (k === 'type' && v.toLowerCase() === 'number') {
        // fix #827 by @rsbondi
        v = ID_NUMBER
      }
      else if (RE_PCEXID.test(v)) {
        // Renames special attributes with expressiones in their value.
        if (BOOL_ATTR.test(k)) k = '__' + k
        else if (~RIOT_ATTR.indexOf(k)) k = 'riot-' + k
      }

      list.push(k + '="' + v + '"')
    }
  }
  return list.join(' ')
}

/*
  Removes comments, replaces the expressions with marker for easier analysis,
  and runs expressions through the parser, except those beginning with `'{^'`
*/
function parseHtml(html, opts, pcex) {

  if (html && ~html.indexOf(opts._b[0])) {
    var
      fn = opts.expr && (opts.parser || opts.type) ? compileJS : 0
    html = tmpl.parse(html, opts, pcex, fn)
  }
  return html
}


/*
  ### HTML Compilation
  --------------------
*/

var
  HTML_COMMENT = /<!--(?!>)[\S\s]*?-->/g,
  HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g

/**
 * The main function for compilation of the HTML section.
 *
 * @param {string} html - Can contain embeded html comments and literal whitespace.
 * @param {Object} opts - Collected user defined options. Includes the brackets array.
 * @param {Array} [pcex] - Keeps precompiled expressions.
 * @returns {string} Parsed html
 */
function compileHTML(html, opts, pcex) {

  if (!opts._b) { // from test
    opts._b = brackets.array(opts.brackets)
    html = html.replace(HTML_COMMENT, '').replace(/[ \t]+$/gm, '')
  }
  if (!html) return ''
  if (!pcex) pcex = []

  // Parse the tags and their attributes
  html = parseHtml(html, opts, pcex).replace(HTML_TAGS,
    function (_, name, attr, ends) {
      name = name.toLowerCase()
      ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''

      // Close self closing tag, except if this is a html5 void tag
      if (attr)
        name += ' ' + parseAttrs(attr)

      return '<' + name + ends + '>'
    })

  // Compact whitespace, or preserve it if opts.whitespace is set
  html = opts.whitespace ?
         html.replace(/\n|\r\n?/g, '\\n') : html.trim().replace(/\s+/g, ' ')

  // For opts.compact, remove whitespace between tags
  return opts.compact ? html.replace(/> <([-\w\/])/g, '><$1') : html
}


/*
  ### JavaScript Compilation
  --------------------------
*/

// Prepare regexp for js comments remotion
var RE_RMCOMMS = regExp(
    '(' + _re.S_QBSRC + ')|' + _re.MLCOMMS.source + '|//[^\r\n]*', 'g')

/**
 * Parses JavaScript code.
 *
 * @param   { string } js - Buffer with the code.
 * @returns { string } Parsed code
 */
function riotjs(js) {

  // Matches es6 methods until first open brace, works for multinine declarations
  var re = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m,
      match,
      es5ms,
      toes5,
      rpart,
      lpart = '',   // parsed code
      pos

  // Removes comments and trims right whitespace
  js = js
      .replace(RE_RMCOMMS, function (m, q) { return q ? m : ' ' })
      .replace(/[ \t]+$/gm, '')

  // $1: indentation
  // $2: method name
  // $3: parameters
  while (match = js.match(re)) {

    // Save remaining part now -- IE9 changes rightContext in RegExp.test!
    rpart = GRE.rightContext

    // Convert ES6 method signature to ES5 function declarion
    toes5 = !/^(?:if|while|switch|for|catch|function)$/.test(match[2])
    es5ms = toes5 ? match[1] + 'this.' + match[2] + ' = function' + match[3] : match[0]

    pos = skipBlock(rpart)        // find the closing bracket
    if (pos < 0) break            // something bad happened

    lpart += js.slice(0, match.index) + es5ms + rpart.slice(0, pos)
    js = rpart.slice(pos)
    if (toes5 && !/^\s*.\s*bind\s*\(/.test(js)) lpart += '.bind(this)'
  }

  return lpart + js

  //// Inner Helpers -----

  // Find the position following a closing bracket, skips inner brackets and qstrings
  function skipBlock(str) {
    var re = regExp('([{}])|' + _re.S_QBSRC, 'g'),
        level = 1,
        match

    while (level && (match = re.exec(str))) {
      if (match[1])
        match[1] === '{' ? ++level : --level
    }
    return level ? -1 : re.lastIndex
  }
}

/*
  Runs the parser for the code, defaults to riotjs
*/
function compileJS(js, opts, type) {
  if (!js) return ''
  if (!type) type = opts.type

  var parser = opts.parser || (type ? parsers.js[type] : riotjs)
  if (!parser)
    throw new Error('JS parser not found: "' + type + '"')

  return parser(js, opts)
}


/*
  ### CSS Compilation
  -------------------
  See: http://www.w3.org/TR/CSS21/
*/

var CSS_SELECTOR = regExp('(^|{|})\ ?([^@][^{}]*)(?={)|' + _re.STRINGS.source, 'g')

// Parse styles enclosed in a "scoped" tag (scoped is deprecated in HTML5)
// 1. Remove CSS comments
// 2. Find selectors and separate them by conmma
// 3. keep special selectors as is
// 4. replace ':scope' with the root tag name, and mirror to [riot-tag]
function scopedCSS(tag, style) {
  var scope = ':scope'

  return style.replace(CSS_SELECTOR, function (m, p1, p2) {
    if (!p2) return m    // quoted string

    p2 = p2.replace(/[^,]+/g, function (s) {
      s = s.trim()
      if (s && s !== 'from' && s !== 'to' && s.slice(-1) !== '%') {
        if (s.indexOf(scope) < 0) s = scope + ' ' + s
        s = s.replace(scope, tag) + ', ' +
            s.replace(scope, '[riot-tag="' + tag + '"]')
      }
      return s
    })
    return p1 ? p1 + ' ' + p2 : p2
  })
}

/*
  Runs the parser for style.
  scoped style is independent from the parser.
*/
function compileCSS(style, tag, type, scoped) {

  if (type) {
    if (type === 'scoped-css') {    // DEPRECATED
      scoped = 1
    }
    else if (parsers.css[type]) {
      style = parsers.css[type](tag, style)
    }
    else if (type !== 'css') {
      throw new Error('CSS parser not found: "' + type + '"')
    }
  }

  // Removes comments, compact whitespace and trims
  style = style.replace(_re.MLCOMMS, '').replace(/\s+/g, ' ').trim()

  // Translate scoped rules if nedded
  return scoped ? scopedCSS(tag, style) : style
}


/*
  ### The tag compiler
  --------------------
*/

var TYPE_ATTR = /\stype\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i

//#if RIOT_CLI
/*
  Returns the value of the attribute 'name'
*/
function getAttr(str, name) {

  if (str) {
    var re = regExp(TYPE_ATTR.source.replace('type', name), 'i'),
        match = str && str.match(re)
    str = match && (match[1] || match[2])
  }
  return str || ''
}
//#endif

/*
  Returns the value of the attribute 'type', remove the 'text/' prefix
*/
function getType(str) {
  if (str) {
    var match = str.match(TYPE_ATTR)
    str = match && (match[1] || match[2])
  }
  return str ? str.replace('text/', '') : ''
}

/*
  Returns an array with info about the source
*/
function getCode(code, opts, attrs) {
  var type = getType(attrs)

  //#if RIOT_CLI
  var src = getAttr(attrs, 'src')
  if (src) {
    var chset = getAttr(attrs, 'charset'),
        path = require('path'),
        fs = require('fs')
    attrs = path.join(opts.basedir || '.', src)
    code = fs.readFileSync(attrs, { encoding: chset || 'utf8' })
  }
  //#endif

  code = compileJS(code, opts, type)

  //#if RIOT_CLI
  if (src)
    code = '// src: ' + src + '\n' + code
  //#endif

  return code
}

var TAG_OR_COMM = /^\s*<(?:\/[-\w]+\s*|[-\w]+(?:\s*\/?(?=>)|\s+[^'">]*(?:(?:"[^"]*"|'[^']*')[^'">]*)*))>\n/

/*
  Returns the start position of the untagged script block
*/
function findScript(str) {
  var i = str.length

  if (/>\s*$/.test(str)) return i

  do {
    if ((i = str.lastIndexOf('>', i - 1)) <= 0) {
      return i
    }
  } while (str[i + 1] !== '\n')

  if (str[i - 1] === '/') return i + 1

  // go slow, backward search for closing or self-closing tag, or comment
  str = str.slice(0, i + 2)
  do {
    i = str.lastIndexOf('>', i - 1)
    if (match = str.slice(i + 1).match(TAG_OR_COMM)) {
      return i + match[0].length + 1
    }
  } while (i > 0)

  return -1
}

/*
  Runs the parser for the entire tag file
*/
function compileTemplate(lang, html) {
  var
    parser = parsers.html[lang]

  if (!parser)
    throw new Error('Template parser not found: "' + lang + '"')

  return parser(html)
}

var
  // CUST_TAG don't allows unquoted expressions with embeeds '>'
  CUST_TAG = /^[ \t]*<([-\w]+)\s*([^'"\/>]*(?:(?:\/[^>]|"[^"]*"|'[^']*')[^'"\/>]*)*)(?:\/|>\n?([^<]*(?:<(?!\/\1\s*>)[^<]*)*)<\/\1\s*)>[ \t]*/gim,
  STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
  SCRIPT = regExp(STYLE.source.replace(/tyle/g, 'cript'), 'gi')

/**
 * The main compiler processes all custom tags, one by one.
 * In tag files, custom tags can span multiple lines, but no other external elements
 * must share these lines.
 * @param   { string } src - String with the custom riot tags.
 * @param   { Object } [opts] - User options.
 * @param   { string } [url] - Filename of the riot tag, prepended to the generated code.
 * @returns { string } - JavaScript code to build the tag through riot.tag2.
 */
function compile(src, opts, url) {

  if (!opts) opts = {}

  opts._b = brackets.array(opts.brackets)

  if (opts.template)
    src = compileTemplate(opts.template, src)

  // Normalize eols before tag processing
  return src
    .replace(/\r\n?/g, '\n')
    .replace(CUST_TAG, function (_, tagName, attribs, content) {

      // content has attributes first, then html and last free javascript code
      // html can include one or more script and style tagged blocks.
      var jscode = '',
          styles = '',
          html = '',
          pcex = []

      tagName = tagName.toLowerCase()

      // Process the attributes, including their expressions
      if (attribs)
        attribs = parseAttrs(parseHtml(attribs, opts, pcex))

        // Remove comments and trim right whitespace
      content = content &&
                content.replace(HTML_COMMENT, '').replace(/[ \t]+$/gm, '')
      if (content) {

        // Get the style blocks
        content = content.replace(STYLE, function (_, _attrs, _style) {
          var scoped = _attrs && /\sscoped(\s|=|$)/i.test(_attrs)
          styles += (styles ? ' ' : '') +
            compileCSS(_style, tagName, getType(_attrs), scoped)
          return ''
        })

        // Separate all script blocks from the html
        content = content.replace(SCRIPT, function (_, _attrs, _script) {
          jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs)
          return ''
        })

        // Find and compile the html part
        var jspos = findScript(content)
        if (~jspos) {
          html = compileHTML(content.slice(0, jspos), opts, pcex)
          content = content.slice(jspos)
        }

        // The remaining part is untagged js code
        if (content.trim())
          jscode += (jscode ? '\n' : '') + compileJS(content, opts)
      }

      url = url ? '// ' + url + '\n' : ''

      return url + mktag(tagName, html, styles, attribs, jscode, pcex)
    })
}
