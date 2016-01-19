//#if 0 // only in the unprocessed source
/*eslint no-unused-vars: [2, {args: "after-used", varsIgnorePattern: "^compile*"}] */
/*global brackets, parsers */
//#endif

function _regEx (str, opt) { return new RegExp(str, opt) }

var
  /**
   * Matches boolean html attributes, prefixed with `__` in the riot tag definition.
   * Used by parseAttr, so names already are lowercased.
   * With a long list like this, a regex is faster than [].indexOf in most browsers.
   * @const {RegExp}
   * @see ../doc/attributes.md
   */
  BOOL_ATTRS = _regEx(
    '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
    'compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|' +
    'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
    'selected|sortable|truespeed|typemustmatch)$'),
  /**
   * The following attributes give error when parsed on browser with `{ exrp_value }`
   * Used by parseAttr, so names already are lowercased.
   * @const {Array}
   * @see ../doc/attributes.md
   */
  RIOT_ATTRS = ['style', 'src', 'd'],
  /**
   * HTML5 void elements that cannot be auto-closed.
   * @const
   * @type {RegExp}
   * @see: http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
   * @see: http://www.w3.org/TR/html5/syntax.html#void-elements
   */
  VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,
  /**
   * Matches values of the property 'type' of input elements which cause issues with
   * invalid values in some browsers. These are compiled with an invalid type (an
   * expression) so the browser defaults to `type=text`. At runtime, the type is set
   * _after_ its value is replaced with the expression value (empty is ok).
   * @const {RegExp}
   */
  SPEC_TYPES = /^"(?:number|date(?:time)?|time|month|email|color)\b/i,
  /**
   * Matches trailing spaces and tabs of each line
   * @const {RegExp}
   */
  TRIM_TRAIL = /[ \t]+$/gm,
  /**
   * Source for regex matching valid JS strings and regexes (recognizes escape characters)
   * @const {string}
   */
  S_LINESTR  = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source,
  /**
   * Source for regex matching quoted strings (multiline), used to match HTML strings.
   * @const {string}
   * @todo recognizes escaped quotes and JS regexes, which is incorrect, but the current
   * logic require it to handle expressions in attribute values -- need to be fixed asap.
   */
  S_STRINGS  = brackets.R_STRINGS.source,
  /**
   * Matches valid HTML comments (to remove) and JS strings/regexes (to skip).
   * Used by cleanSource.
   * @const {RegExp}
   */
  HTML_COMMS = _regEx(/<!--(?!>)[\S\s]*?-->/.source + '|' + S_LINESTR, 'g'),
  /**
   * Matches pairs attribute=value, both quoted and unquoted.
   * Names can contain almost all iso-8859-1 character set.
   * Used by parseAttrs, assume hidden expressions and compact spaces (no eols).
   * @const {RegExp}
   */
  HTML_ATTRS = / *([-\w:\xA0-\xFF]+) ?(?:= ?('[^']*'|"[^"]*"|\S+))?/g,
  /**
   * HTML_TAGS matches opening and self-closing tags, not the content.
   * Used by _compileHTML after hidding the expressions.
   * 2016-01-18: exclude \s from attr capture to avoid unnecessary call to parseAttrs
   * @const {RegExp}
   */
  HTML_TAGS = /<([-\w]+)(?:\s+([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)(\/?)>/g,
  /**
   * Matches `<pre>` elements to hidde its content ($1) from whitespace compactation.
   * Used by _compileHTML after processing the attributes and self-closing tags.
   * @const {RegExp}
   */
  PRE_TAGS = /<pre(?:\s+(?:[^">]*|"[^"]*")*)?>([\S\s]+?)<\/pre\s*>/gi

//#if NODE
var path = require('path')    // used by getCode()
//#endif

//#if !$_RIX_INCLUDED
/* eslint-disable no-constant-condition */
if (1) throw new Error('You must #include brackets before this code!')
/* eslint-enable no-constant-condition */
//#elif 0
var
  $_RIX_TEST = 4,
  $_RIX_PAIR = 8
//#endif

/**
 * Creating the brackets array only if needed avoids re-creating regexes, a costly
 * process for this (mostly) one-time operation.
 * @since v2.3.22
 */
var getBPairs = (function () {
  var abp, sbp = '@'

  return function (s) {
    if (s !== sbp) {
      sbp = s
      abp = brackets.array(s)
    }
    return abp
  }
})()

/**
 * Encloses the given string in single quotes.
 * 2016-01-08: we must escape single quotes and backslashes before quoting the
 * string, but there's no need to care about line-endings, each submodule does it.
 *
 * @param   {string} s - unquoted string
 * @returns {string} quoted string, with escaped single-quotes and backslashes
 */
function q (s) {
  return "'" + (s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '') + "'"
}

/**
 * Generates code to call the `riot.tag2` function with the processed parts.
 *
 * @param   {string} name  - The tag name
 * @param   {string} html  - HTML (can contain embeded eols)
 * @param   {string} css   - Styles
 * @param   {string} attrs - Root attributes
 * @param   {string} js    - JavaScript "constructor"
 * @param   {Array}  pcex  - Expressions
 * @returns {string} Code to call `riot.tag2`
 */
function mktag (name, html, css, attrs, js, pcex) {
  var
    c = ', ',
    s = '}' + (pcex.length ? ', ' + q(pcex._bp[$_RIX_PAIR]) : '') + ');'

  // give more consistency to the output
  if (js && js.slice(-1) !== '\n') s = '\n' + s

  // 2016-01-08: html can contain eols if opts.whitespace=1, fix after q()
  return 'riot.tag2(\'' + name + "'" + c + q(html).replace(/\n/g, '\\n') +
    c + q(css) + c + q(attrs) + ', function(opts) {\n' + js + s
}

/**
 * Parses and formats attributes.
 *
 * @param   {string} str  - Attributes, with expressions replaced by their hash
 * @param   {Array}  pcex - Has a _bp property with info about brackets
 * @returns {string} Formated attributes
 */
function parseAttrs (str, pcex) {
  var
    list = [],
    match,
    k, v, t, e,
    DQ = '"'

  HTML_ATTRS.lastIndex = 0

  str = str.replace(/\s+/g, ' ')

  while (match = HTML_ATTRS.exec(str)) {

    // all attribute names are converted to lower case
    k = match[1].toLowerCase()
    v = match[2]

    if (!v) {
      list.push(k)          // boolean attribute without explicit value
    }
    else {
      // attribute values must be enclosed in double quotes
      if (v[0] !== DQ) {
        v = DQ + (v[0] === "'" ? v.slice(1, -1) : v) + DQ
      }

      if (k === 'type' && SPEC_TYPES.test(v)) {
        t = v               // we'll check if value contains expression
      }
      else {
        if (/\u0001\d/.test(v)) {
          // renames special attributes with expressiones in their value.
          if (k === 'value') e = 1
          else if (BOOL_ATTRS.test(k)) k = '__' + k
          else if (~RIOT_ATTRS.indexOf(k)) k = 'riot-' + k
        }
        // join the key-value pair, with no spaces between the parts
        list.push(k + '=' + v)
      }
    }
  }
  // update() will evaluate `type` after the value, avoiding warnings
  if (t) {
    if (e) t = DQ + pcex._bp[0] + "'" + t.slice(1, -1) + "'" + pcex._bp[1] + DQ
    list.push('type=' + t)
  }
  return list.join(' ')     // returns the attribute list
}

/**
 * Replaces expressions with a marker, and runs expressions through the parser,
 * if any, except those beginning with `{^` (hack for riot#1014 and riot#1090).
 *
 * @param   {string} html - Raw html without comments
 * @param   {object} opts - The options, as passed to the compiler
 * @param   {Array}  pcex - To store the extracted expressions
 * @returns {string} html with its expressions replaced with markers
 */
function splitHtml (html, opts, pcex) {
  var _bp = pcex._bp

  // `brackets.split` is a heavy function, so don't call it if not necessary
  if (html && _bp[$_RIX_TEST].test(html)) {
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
      list[i] = '\u0001' + (pcex.push(expr) - 1) + _bp[1]
    }
    html = list.join('')
  }
  return html
}

/**
 * Clean and restore expressions hidden by splitHtml and escape raw HTML text.
 *
 * @param   {string} html - The HTML source with hidden expresions
 * @param   {Array}  pcex - Array with unformatted expressions
 * @returns {string} html with clean expressions in place
 */
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
        // 2016-01-18: chaining replaces seems most efficient
        return pcex._bp[0] + expr.trim().replace(/[\r\n]+/g, ' ').replace(/"/g, '\u2057')
      })
  }
  return html
}

/**
 * Normalizes eols and removes HTML comments without touching the strings,
 * avoiding unnecesary replacements.
 * Skip the strings is less expansive than replacing with itself.
 *
 * @param   {string} src - The html source with comments
 * @returns {string} html without comments
 * @since v2.3.22
 */
function cleanSource (src) {
  var mm,
    re = HTML_COMMS

  if (~src.indexOf('\r')) {
    src = src.replace(/\r\n?/g, '\n')
  }

  re.lastIndex = 0
  while (mm = re.exec(src)) {
    if (mm[0][0] === '<') {
      src = RegExp.leftContext + RegExp.rightContext
      re.lastIndex = mm[3] + 1
    }
  }
  return src
}

/*
  ## HTML Compilation
  -----------------------------------------------------------------------------
  - Runs each expression through the parser and replace it with a marker
  - Removes trailing tab and spaces
  - Normalizes and formats the attribute-value pairs
  - Closes self-closing tags
  - Normalizes and restores the expressions
*/

/**
 * The internal HTML compiler.
 *
 * @param   {string} html - Raw html string
 * @param   {object} opts - Compilation options received by compile or compileHTML
 * @param   {Array}  pcex - To store the expressions found
 * @returns {string} Processed HTML code which can be used by riot.tag2
 * @private
 * @see http://www.w3.org/TR/html5/syntax.html
 */
function _compileHTML (html, opts, pcex) {

  // separate the expressions, then parse the tags and their attributes
  html = splitHtml(html, opts, pcex)
    .replace(HTML_TAGS, function (_, name, attr, ends) {
      // force all tag names to lowercase
      name = name.toLowerCase()
      // close self-closing tag, except if this is a html5 void tag
      ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''
      // format the attributes
      if (attr) name += ' ' + parseAttrs(attr, pcex)

      return '<' + name + ends + '>'
    })

  // tags parsed, now compact whitespace if `opts.whitespace` is not set
  if (!opts.whitespace) {
    var p = []

    // hide any `<pre>` tags from the compactation
    if (/<pre[\s>]/.test(html)) {
      html = html.replace(PRE_TAGS, function (_q) {
        p.push(_q)
        return '\u0002'
      })
    }
    html = html.trim().replace(/\s+/g, ' ')

    // istanbul ignore else
    if (p.length) html = html.replace(/\u0002/g, function () { return p.shift() })
  }

  // for `opts.compact`, remove tabs and spaces between tags
  if (opts.compact) html = html.replace(/>[ \t]+<([-\w\/])/g, '><$1')

  // 2016-01-16: new logic in compile makes necessary another TRIM_TRAIL
  return restoreExpr(html, pcex).replace(TRIM_TRAIL, '')
}

/**
 * Parses and formats the HTML text.
 *
 * @param   {string} html   - Can contain embedded HTML comments and literal whitespace
 * @param   {Object} opts   - Collected user options. Includes the brackets array in `_bp`
 * @param   {Array}  [pcex] - Keeps precompiled expressions
 * @returns {string} The parsed HTML text
 */
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
  // `_bp` is undefined when `compileHTML` is not called by compile
  if (!pcex._bp) pcex._bp = brackets.array(opts.brackets)

  return _compileHTML(cleanSource(html), opts, pcex)
}

/*
  ## JavaScript Compilation
  ------------------------------------------------------------------------------
  - If the given code is empty or whitespaces only, returns an empty string
  - Determines the parser to use, by default the internal riotjs function
  - Call the parser, the default riotjs removes comments, converts ES6 method
    signatures to ES5 and bind to `this` if neccesary
  - Normalizes line-endings and trims trailing spaces before returns the result
 */

var
  /**
   * Matches ES6 methods across multiple lines up to its first curly brace.
   * 2016-01-18: rewritten to capture only the method name (performant)
   * @const {RegExp}
   */
  JS_ES6SIGN = /^[ \t]*([$_A-Za-z][$\w]*)\s*\([^()]*\)\s*{/m,
  /**
   * Regex for remotion of multiline and single-line JavaScript comments, mixed with
   * S_QBLOCKS for exclusion of string and literal regexes.
   * 2016-01-18: rewritten to not capture brackets (reduces 9 steps)
   * @const {RegExp}
   * @private
   */
  JS_ES6END = _regEx('[{}]|' + brackets.S_QBLOCKS, 'g'),
  /**
   * Regex for remotion of multiline and single-line JavaScript comments, mixed with
   * S_QBLOCKS for exclusion of string and literal regexes.
   * @const {RegExp}
   */
  JS_COMMS = _regEx(brackets.R_MLCOMMS.source + '|//[^\r\n]*|' + brackets.S_QBLOCKS, 'g')

/**
 * Default parser for JavaScript, supports ES6-like method syntax
 *
 * @param   {string} js - Raw JavaScript code
 * @returns {string} Code with ES6 methods converted to ES5, comments removed
 */
function riotjs (js) {
  var
    parts = [],   // parsed code
    match,
    toes5,
    pos, name, rm

  // 2016-01-08: remove comments without touching qblocks (avoid reallocation)
  JS_COMMS.lastIndex = 0
  while (rm = JS_COMMS.exec(js)) {
    if (rm[0][0] === '/' && !rm[1] && !rm[2]) { // $1:div, $2:regex
      js = RegExp.leftContext + ' ' + RegExp.rightContext
      JS_COMMS.lastIndex = rm[3] + 1          // $3:matchOffset
    }
  }

  // $1: method name
  while (match = js.match(JS_ES6SIGN)) {
    // save the processed part
    parts.push(RegExp.leftContext)
    js = RegExp.rightContext

    // 2016-01-18: inline the search for finding the closing bracket
    JS_ES6END.lastIndex = 0
    pos = 1
    while (pos && (rm = JS_ES6END.exec(js))) {
      if (rm[0] === '{') ++pos
      else if (rm[0] === '}') --pos
    }
    pos = pos ? js.length : JS_ES6END.lastIndex

    // convert ES6 method signature to ES5 function, exclude JS keywords
    name = match[1]
    toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(name)
    name = toes5 ? match[0].replace(name, 'this.' + name + ' = function') : match[0]
    parts.push(name, js.slice(0, pos))
    js = js.slice(pos)

    // bind to `this` if needed
    if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
  }

  return parts.length ? parts.join('') + js : js
}

/**
 * Internal JavaScript compilation.
 *
 * @param   {string} js   - Raw JavaScript code
 * @param   {object} opts - Compiler options
 * @param   {string} type - Parser name
 * @param   {object} parserOpts - User options passed to the parser
 * @param   {string} url  - Of the file being compiled, passed to the parser
 * @returns {string} Compiled code, eols normalized, trailing spaces removed
 * @private
 */
function _compileJS (js, opts, type, parserOpts, url) {
  if (!/\S/.test(js)) return ''
  if (!type) type = opts.type

  var parser = opts.parser || (type ? parsers.js[type] : riotjs)

  if (!parser) {
    throw new Error('JS parser not found: "' + type + '"')
  }
  return parser(js, parserOpts, url).replace(/\r\n?/g, '\n').replace(TRIM_TRAIL, '')
}

/**
 * Runs the parser for the JavaScript code, defaults to `riotjs`
 *
 * @param   {string} js      - Buffer with the javascript code
 * @param   {Object} [opts]  - Compiler options
 * @param   {string} [type]  - Optional type for parser selection
 * @param   {Object} [extra] - User options for the parser
 * @returns {string} The parsed JavaScript code
 */
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

/*
  ## CSS Compiler
  ------------------------------------------------------------------------------
  - If the given code is empty or whitespaces only, returns an empty string
  - Determines the parser to use, by default the internal riotjs function
  - Call the parser, the default riotjs removes comments, converts ES6 method
    signatures to ES5 and bind to `this` if neccesary
  - Normalizes line-endings and trims trailing spaces before returns the result
  See http://www.w3.org/TR/CSS21/
*/

// Prepare regex to match CSS selectors, excluding those beginning with '@'.
var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + S_LINESTR, 'g')

// Parses styles enclosed in a "scoped" tag (`scoped` is deprecated in HTML5).
// The "style" string is received without comments or surrounding spaces.
function scopedCSS (tag, style) {
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
 * Internal CSS compilation.
 * Runs any parser for style blocks and call to scopedCSS if required.
 *
 * @param   {string} style - Raw CSS
 * @param   {string} tag   - Tag name to which the style belongs to
 * @param   {string} type  - Parser name to run
 * @param   {object} opts  - Compiler options (can include parserOptions)
 * @returns {string} The compiled style, whitespace compacted and trimmed
 */
function _compileCSS (style, tag, type, opts) {
  var scoped = (opts || (opts = {})).scoped

  if (type) {
    if (type === 'scoped-css') {    // DEPRECATED
      scoped = true
    }
    else if (parsers.css[type]) {
      style = parsers.css[type](tag, style, opts.parserOpts || {}, opts.url)
    }
    else if (type !== 'css') {
      throw new Error('CSS parser not found: "' + type + '"')
    }
  }

  // remove comments, compact and trim whitespace
  style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

  // translate scoped rules if nedded
  if (scoped) {
    // istanbul ignore next
    if (!tag) {
      throw new Error('Can not parse scoped CSS without a tagName')
    }
    style = scopedCSS(tag, style)
  }
  return style
}

/**
 * Public API to the compileCSS function, makes parser and opts optional.
 *
 * @param   {string} style    - Raw style block
 * @param   {string} [parser] - Must be one of `parsers.css`
 * @param   {object} [opts]   - passed to the given parser
 * @returns {string} The processed style block
 */
// istanbul ignore next
function compileCSS (style, parser, opts) {
  if (parser && typeof parser === 'object') {
    opts = parser
    parser = ''
  }
  return _compileCSS(style, opts.tagName, parser, opts)
}

/*
  ## The main compiler
  -----------------------------------------------------------------------------
*/

// TYPE_ATTR matches the 'type' attribute, for script and style tags
var
  TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,  // don't handle escaped quotes :(
  MISC_ATTR = '\\s*=\\s*(' + S_STRINGS + '|{[^}]+}|\\S+)'

// Returns the value of the 'type' attribute, with the prefix "text/" removed.
function getType (str) {

  if (str) {
    var match = str.match(TYPE_ATTR)

    str = match && (match[2] || match[3])
  }
  return str ? str.replace('text/', '') : ''
}

// Returns the value of any attribute, or the empty string for missing attribute.
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

// get the parser options from the options attribute
function getParserOptions (attrs) {
  var opts = getAttr(attrs, 'options')

  // convert the string into a valid js object
  if (opts) opts = JSON.parse(opts)
  return opts
}

// Runs the custom or default parser on the received JavaScript code.
// The CLI version can read code from the file system (experimental)
function getCode (code, opts, attrs, url) {
  var type = getType(attrs),
    parserOpts = getParserOptions(attrs)

  //#if NODE
  var src = getAttr(attrs, 'src')

  if (src) {
    var charset = getAttr(attrs, 'charset'),
      file = path.resolve(path.dirname(url), src)

    code = require('fs').readFileSync(file, charset || 'utf8')
  }
  //#endif
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

// Matches HTML tag ending a line. This regex still can be fooled by code as:
// ```js
// x <y && y >
//  z
// ```
var END_TAGS = /\/>\n|^<(?:\/[-\w]+\s*|[-\w]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/

function splitBlocks (str) {
  var k, m

  /* istanbul ignore next: this if() can't be true, but just in case... */
  if (/<[-\w]/.test(str)) {
    k = str.lastIndexOf('<')    // first probable open tag
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

/**
 * Runs the external HTML parser for the entire tag file
 *
 * @param   {string} html - Entire, untouched html received for the compiler
 * @param   {string} url  - The source url or file name
 * @param   {string} lang - Name of the parser, one of `parsers.html`
 * @param   {object} opts - Extra option passed to the parser
 * @returns {string} parsed html
 */
function compileTemplate (html, url, lang, opts) {
  var parser = parsers.html[lang]

  if (!parser) {
    throw new Error('Template parser not found: "' + lang + '"')
  }
  return parser(html, opts, url)
}

/*
  CUST_TAG regex don't allow unquoted expressions containing the `>` operator.
  STYLES and SCRIPT disallows the operator `>` at all.
  The beta.4 CUST_TAG regex is fast, with RegexBuddy I get 76 steps and 14 backtracks on
  the test/specs/fixtures/treeview.tag :) but fails with nested tags of the same name :(
  With a greedy * operator, we have ~500 and 200bt, it is acceptable. So let's fix this.
 */
// TODO: CUST_TAG fails with unescaped regex in the root attributes having '>' characters.
//       We need brackets.split here?
var
  CUST_TAG = _regEx(/^([ \t]*)<([-\w]+)(?:\s+([^'"\/>]+(?:(?:@|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/
    .source.replace('@', S_STRINGS), 'gim'),
  SCRIPTS = /<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi,
  STYLES = /<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi

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
function compile (src, opts, url) {
  var
    parts = [],
    exclude

  if (!opts) opts = {}

  //#if NODE
  // let's be sure that an url is always defined at least on node
  // this will allow the babeljs users using the .babelrc file to configure
  // their transpiler setup
  if (!url) url = process.cwd() + '/.'   // getCode expect a file
  //#else
  if (!url) url = ''
  //#endif

  exclude = opts.exclude || false
  function included (s) { return !(exclude && ~exclude.indexOf(s)) }

  // get a static brackets array for use on the entire source
  var _bp = getBPairs(opts.brackets)

  // run any custom html parser before the compilation
  if (opts.template) {
    src = compileTemplate(src, url, opts.template, opts.templateOptions)
  }

  // normalize eols and start processing the tags
  src = cleanSource(src)
    .replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {

      // content can have attributes first, then html markup with zero or more script or
      // style tags of different types, and finish with an untagged block of js code.
      var
        jscode = '',
        styles = '',
        html = '',
        pcex = []

      pcex._bp = _bp    // local copy, in preparation for async compilation

      tagName = tagName.toLowerCase()

      // process the attributes, including their expressions
      attribs = attribs && included('attribs')
        ? restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex), pcex), pcex) : ''

      // remove comments and trim trailing whitespace
      if ((body || (body = body2)) && /\S/.test(body)) {

        if (body2) {
          /* istanbul ignore next */
          html = included('html') ? _compileHTML(body2, opts, pcex) : ''
        }
        else {
          // separate the untagged javascript block from the html markup
          var blocks = splitBlocks(
            body.replace(_regEx('^' + indent, 'gm'), '').replace(TRIM_TRAIL, '')
          )

          // get and process the style blocks
          body = blocks[0].replace(STYLES, function (_m, _attrs, _style) {
            if (included('css')) {
              styles += (styles ? ' ' : '') + cssCode(_style, opts, _attrs, url, tagName)
            }
            return ''
          })

          // now the script blocks
          body = body.replace(SCRIPTS, function (_m, _attrs, _script) {
            if (included('js')) {
              jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
            }
            return ''
          })

          // process the remaining html part
          if (included('html')) {
            html = _compileHTML(body, opts, pcex)
          }

          // and the untagged js block
          if (included('js')) {
            body = _compileJS(blocks[1], opts, null, null, url)
            if (body) jscode += (jscode ? '\n' : '') + body
          }
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

  if (opts.entities) return parts

  //#if NODE
  // Note: isAbsolute does not exists in node 10.x
  if (opts.debug) {
    /* istanbul ignore if */
    if (path.isAbsolute(url)) url = path.relative('.', url)
    src = '//src: ' + url.replace(/\\/g, '/') + '\n' + src
  }
  //#endif
  return src
}
