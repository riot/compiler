/**
 * The riot-compiler v2.5.2
 *
 * @module compiler
 * @version v2.5.2
 * @license MIT
 * @copyright Muut Inc. + contributors
 */
'use strict'

var brackets  = require('./brackets')
var parsers   = require('./parsers')
var safeRegex = require('./safe-regex')
var path      = require('path')

var extend = require('./parsers/_utils').mixobj
/* eslint-enable */

/**
 * Source for creating regexes matching valid quoted, single-line JavaScript strings.
 * It recognizes escape characters, including nested quotes and line continuation.
 * @const {string}
 */
var S_LINESTR = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source

/**
 * Source of {@link module:brackets.S_QBLOCKS|brackets.S_QBLOCKS} for creating regexes
 * matching multiline HTML strings and/or skip literal strings inside expressions.
 * @const {string}
 * @todo Bad thing. It recognizes escaped quotes (incorrect for HTML strings) and multiline
 *  strings without line continuation `'\'` (incorrect for expressions). Needs to be fixed
 *  ASAP but the current logic requires it to parse expressions inside attribute values :[
 */
var S_STRINGS = brackets.R_STRINGS.source

/**
 * Matches pairs attribute=value, both quoted and unquoted.
 * Names can contain almost all iso-8859-1 character set.
 * Used by {@link module:compiler~parseAttribs|parseAttribs}, assume hidden
 * expressions and compact spaces (no EOLs).
 * @const {RegExp}
 */
var HTML_ATTRS = / *([-\w:\xA0-\xFF]+) ?(?:= ?('[^']*'|"[^"]*"|\S+))?/g

/**
 * Matches valid HTML comments (to remove) and JS strings/regexes (to skip).
 * Used by [cleanSource]{@link module:compiler~cleanSource}.
 * @const {RegExp}
 */
var HTML_COMMS = RegExp(/<!--(?!>)[\S\s]*?-->/.source + '|' + S_LINESTR, 'g')

/**
 * HTML_TAGS matches opening and self-closing tags, not the content.
 * Used by {@link module:compiler~_compileHTML|_compileHTML} after hidding
 * the expressions.
 *
 * 2016-01-18: exclude `'\s'` from attr capture to avoid unnecessary call to
 *  {@link module:compiler~parseAttribs|parseAttribs}
 * @const {RegExp}
 */
var HTML_TAGS = /<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)(\/?)>/g

/**
 * Matches spaces and tabs between HTML tags
 * Used by the `compact` option.
 * @const RegExp
 */
var HTML_PACK = />[ \t]+<(-?[A-Za-z]|\/[-A-Za-z])/g

/**
 * Matches boolean HTML attributes, prefixed with `"__"` in the riot tag definition.
 * Used by {@link module:compiler~parseAttribs|parseAttribs} with lowercase names.
 * With a long list like this, a regex is faster than `[].indexOf` in most browsers.
 * @const {RegExp}
 * @see [attributes.md](https://github.com/riot/compiler/blob/dev/doc/attributes.md)
 */
var BOOL_ATTRS = RegExp(
    '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
    'compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|' +
    'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
    'selected|sortable|truespeed|typemustmatch)$')

/**
 * These attributes give error when parsed on browsers with an expression in its value.
 * Ex: `<img src={ exrp_value }>`.
 * Used by {@link module:compiler~parseAttribs|parseAttribs} with lowercase names only.
 * @const {Array}
 * @see [attributes.md](https://github.com/riot/compiler/blob/dev/doc/attributes.md)
 */
var RIOT_ATTRS = ['style', 'src', 'd']

/**
 * HTML5 void elements that cannot be auto-closed.
 * @const {RegExp}
 * @see   {@link http://www.w3.org/TR/html-markup/syntax.html#syntax-elements}
 * @see   {@link http://www.w3.org/TR/html5/syntax.html#void-elements}
 */
var VOID_TAGS = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/

/**
 * Matches `<pre>` elements to hide its content ($1) from whitespace compactation.
 * Used by {@link module:compiler~_compileHTML|_compileHTML} after processing the
 * attributes and the self-closing tags.
 * @const {RegExp}
 */
var PRE_TAGS = /<pre(?:\s+(?:[^">]*|"[^"]*")*)?>([\S\s]+?)<\/pre\s*>/gi

/**
 * Matches values of the property 'type' of input elements which cause issues with
 * invalid values in some browsers. These are compiled with an invalid type (an
 * expression) so the browser defaults to `type="text"`. At runtime, the type is reset
 * _after_ its value is replaced with the evaluated expression or an empty value.
 * @const {RegExp}
 */
var SPEC_TYPES = /^"(?:number|date(?:time)?|time|month|email|color)\b/i

/**
 * Matches the 'import' statement
 * @const {RegExp}
 */
var IMPORT_STATEMENT = /^(?: )*(?:import)(?:(?:.*))*$/gm

/**
 * Matches trailing spaces and tabs by line.
 * @const {RegExp}
 */
var TRIM_TRAIL = /[ \t]+$/gm

var
  RE_HASEXPR = safeRegex(/@#\d/, 'x01'),
  RE_REPEXPR = safeRegex(/@#(\d+)/g, 'x01'),
  CH_IDEXPR  = '\x01#',
  CH_DQCODE  = '\u2057',
  DQ = '"',
  SQ = "'"

/**
 * Normalizes eols and removes HTML comments without touching the strings,
 * avoiding unnecesary replacements.
 * Skip the strings is less expansive than replacing with itself.
 *
 * @param   {string} src - The HTML source with comments
 * @returns {string} HTML without comments
 * @since v2.3.22
 */
function cleanSource (src) {
  var
    mm,
    re = HTML_COMMS

  if (~src.indexOf('\r')) {
    src = src.replace(/\r\n?/g, '\n')
  }

  re.lastIndex = 0
  while ((mm = re.exec(src))) {
    if (mm[0][0] === '<') {
      src = RegExp.leftContext + RegExp.rightContext
      re.lastIndex = mm[3] + 1
    }
  }
  return src
}

/**
 * Parses attributes. Force names to lowercase, enclose the values in double quotes,
 * and compact spaces.
 * Take care about issues in some HTML5 input elements with expressions in its value.
 *
 * @param   {string} str  - Attributes, with expressions replaced by their hash
 * @param   {Array}  pcex - Has a `_bp` property with info about brackets
 * @returns {string} Formated attributes
 */
function parseAttribs (str, pcex) {
  var
    list = [],
    match,
    type, vexp

  HTML_ATTRS.lastIndex = 0

  str = str.replace(/\s+/g, ' ')

  while ((match = HTML_ATTRS.exec(str))) {
    var
      k = match[1].toLowerCase(),
      v = match[2]

    if (!v) {
      list.push(k)
    } else {

      if (v[0] !== DQ) {
        v = DQ + (v[0] === SQ ? v.slice(1, -1) : v) + DQ
      }

      if (k === 'type' && SPEC_TYPES.test(v)) {
        type = v
      } else {
        if (RE_HASEXPR.test(v)) {

          if (k === 'value') vexp = 1
          else if (BOOL_ATTRS.test(k)) k = '__' + k
          else if (~RIOT_ATTRS.indexOf(k)) k = 'riot-' + k
        }

        list.push(k + '=' + v)
      }
    }
  }

  if (type) {
    if (vexp) type = DQ + pcex._bp[0] + SQ + type.slice(1, -1) + SQ + pcex._bp[1] + DQ
    list.push('type=' + type)
  }
  return list.join(' ')
}

/**
 * Replaces expressions with a marker and runs expressions through the parser,
 * if any, except those beginning with `"{^"` (hack for riot#1014 and riot#1090).
 *
 * @param   {string} html - Raw html without comments
 * @param   {object} opts - The options, as passed to the compiler
 * @param   {Array}  pcex - To store the extracted expressions
 * @returns {string} html with its expressions replaced with markers
 *
 * @see {@link module:brackets.split|brackets.split}
 */
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
      } else if (jsfn) {
        expr = jsfn(expr, opts).trim()
        if (expr.slice(-1) === ';') expr = expr.slice(0, -1)
      }
      list[i] = CH_IDEXPR + (pcex.push(expr) - 1) + _bp[1]
    }
    html = list.join('')
  }
  return html
}

/**
 * Cleans and restores hidden expressions encoding double quotes to prevent issues
 * with browsers (breaks attributes) and encode `"<>"` for expressions with raw HTML.
 *
 * @param   {string} html - The HTML source with hidden expresions
 * @param   {Array}  pcex - Array with unformatted expressions
 * @returns {string} HTML with clean expressions in its place.
 */
function restoreExpr (html, pcex) {
  if (pcex.length) {
    html = html.replace(RE_REPEXPR, function (_, d) {

      return pcex._bp[0] + pcex[d].trim().replace(/[\r\n]+/g, ' ').replace(/"/g, CH_DQCODE)
    })
  }
  return html
}

/**
 * Return imports statement of the code as a string
 * @param    {string} js - The js code containing the imports statement
 * @returns  {string} Js code containing only the imports statement
 */
function compileImports (js) {
  var imp = []
  var imports = ''
  while (imp = IMPORT_STATEMENT.exec(js)) {
    imports += imp[0].trim() + '\n'
  }
  return imports
}

/**
 * Remove 'import' statement from JSCode
 * @param    {string} js - The Js code
 * @returns  {string} jsCode The js code without 'import' statement
 */
function rmImports (js) {
  var jsCode = js.replace(IMPORT_STATEMENT, '')
  return jsCode
}

/**
 * The internal HTML compiler.
 *
 * @param   {string} html - Raw HTML string
 * @param   {object} opts - Compilation options received by compile or compileHTML
 * @param   {Array}  pcex - To store extracted expressions, must include `_bp`
 * @returns {string} Parsed HTML code which can be used by `riot.tag2`.
 *
 * @see {@link http://www.w3.org/TR/html5/syntax.html}
 */
function _compileHTML (html, opts, pcex) {

  html = splitHtml(html, opts, pcex)
    .replace(HTML_TAGS, function (_, name, attr, ends) {

      name = name.toLowerCase()

      ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''

      if (attr) name += ' ' + parseAttribs(attr, pcex)

      return '<' + name + ends + '>'
    })

  if (!opts.whitespace) {
    var p = []

    if (/<pre[\s>]/.test(html)) {
      html = html.replace(PRE_TAGS, function (q) {
        p.push(q)
        return '\u0002'
      })
    }

    html = html.trim().replace(/\s+/g, ' ')

    if (p.length) html = html.replace(/\u0002/g, function () { return p.shift() })
  }

  if (opts.compact) html = html.replace(HTML_PACK, '><$1')

  return restoreExpr(html, pcex).replace(TRIM_TRAIL, '')
}

/**
 * Public interface to the internal HTML compiler, parses and formats the HTML part.
 *
 * - Runs each expression through the parser and replace it with a marker
 * - Removes trailing tab and spaces
 * - Normalizes and formats the attribute-value pairs
 * - Closes self-closing tags
 * - Normalizes and restores the expressions
 *
 * @param   {string} html   - Can contain embedded HTML comments and literal whitespace
 * @param   {Object} [opts] - User options.
 * @param   {Array}  [pcex] - To store precompiled expressions
 * @returns {string} The parsed HTML markup, which can be used by `riot.tag2`
 * @static
 */
function compileHTML (html, opts, pcex) {

  if (Array.isArray(opts)) {
    pcex = opts
    opts = {}
  } else {
    if (!pcex) pcex = []
    if (!opts) opts = {}
  }

  pcex._bp = brackets.array(opts.brackets)

  return _compileHTML(cleanSource(html), opts, pcex)
}

/**
 * Matches ES6 methods across multiple lines up to its first curly brace.
 * Used by the {@link module:compiler~riotjs|riotjs} parser.
 *
 * 2016-01-18: rewritten to capture only the method name (performant)
 * @const {RegExp}
 */
var JS_ES6SIGN = /^[ \t]*([$_A-Za-z][$\w]*)\s*\([^()]*\)\s*{/m

/**
 * Regex for remotion of multiline and single-line JavaScript comments, merged with
 * {@link module:brackets.S_QBLOCKS|brackets.S_QBLOCKS} to skip literal string and regexes.
 * Used by the {@link module:compiler~riotjs|riotjs} parser.
 *
 * 2016-01-18: rewritten to not capture the brackets (reduces 9 steps)
 * @const {RegExp}
 */
var JS_ES6END = RegExp('[{}]|' + brackets.S_QBLOCKS, 'g')

/**
 * Regex for remotion of multiline and single-line JavaScript comments, merged with
 * {@link module:brackets.S_QBLOCKS|brackets.S_QBLOCKS} to skip literal string and regexes.
 * @const {RegExp}
 */
var JS_COMMS = RegExp(brackets.R_MLCOMMS.source + '|//[^\r\n]*|' + brackets.S_QBLOCKS, 'g')

/**
 * Default parser for JavaScript, supports ES6-like method syntax
 *
 * @param   {string} js - Raw JavaScript code
 * @returns {string} Code with ES6 methods converted to ES5, comments removed.
 */
function riotjs (js) {
  var
    parts = [],
    match,
    toes5,
    pos,
    name,
    RE = RegExp

  if (~js.indexOf('/')) js = rmComms(js, JS_COMMS)

  while ((match = js.match(JS_ES6SIGN))) {

    parts.push(RE.leftContext)
    js  = RE.rightContext
    pos = skipBody(js, JS_ES6END)

    name  = match[1]
    toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(name)
    name  = toes5 ? match[0].replace(name, 'this.' + name + ' = function') : match[0]
    parts.push(name, js.slice(0, pos))
    js = js.slice(pos)

    if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
  }

  return parts.length ? parts.join('') + js : js

  function rmComms (s, r, m) {
    r.lastIndex = 0
    while ((m = r.exec(s))) {
      if (m[0][0] === '/' && !m[1] && !m[2]) {
        s = RE.leftContext + ' ' + RE.rightContext
        r.lastIndex = m[3] + 1
      }
    }
    return s
  }

  function skipBody (s, r) {
    var m, i = 1

    r.lastIndex = 0
    while (i && (m = r.exec(s))) {
      if (m[0] === '{') ++i
      else if (m[0] === '}') --i
    }
    return i ? s.length : r.lastIndex
  }
}

/**
 * Internal JavaScript compilation.
 *
 * @param   {string} js   - Raw JavaScript code
 * @param   {object} opts - Compiler options
 * @param   {string} type - Parser name, one of {@link module:parsers.js|parsers.js}
 * @param   {object} parserOpts - User options passed to the parser
 * @param   {string} url  - Of the file being compiled, passed to the parser
 * @returns {string} Compiled code, eols normalized, trailing spaces removed
 *
 * @throws  Will throw "JS parser not found" if the JS parser cannot be loaded.
 * @see     {@link module:compiler.compileJS|compileJS}
 */
function _compileJS (js, opts, type, parserOpts, url) {
  if (!/\S/.test(js)) return ''
  if (!type) type = opts.type

  var parser = opts.parser || type && parsers._req('js.' + type, true) || riotjs

  return parser(js, parserOpts, url).replace(/\r\n?/g, '\n').replace(TRIM_TRAIL, '')
}

/**
 * Public interface to the internal JavaScript compiler, runs the parser with
 * the JavaScript code, defaults to `riotjs`.
 *
 * - If the given code is empty or whitespaces only, returns an empty string
 * - Determines the parser to use, by default the internal riotjs function
 * - Call the parser, the default {@link module:compiler~riotjs|riotjs} removes comments,
 *   converts ES6 method signatures to ES5 and bind to `this` if neccesary
 * - Normalizes line-endings and trims trailing spaces before return the result
 *
 * @param  {string} js     - Buffer with the javascript code
 * @param  {Object} [opts] - Compiler options (DEPRECATED parameter, don't use it)
 * @param  {string} [type=riotjs] - Parser name, one of {@link module:parsers.js|parsers.js}
 * @param  {Object} [userOpts={}] - User options
 * @param  {string} [userOpts.url=process.cwd] - Url of the .tag file (passed to the parser)
 * @param  {object} [userOpts.parserOpts={}]   - User options (passed to the parser)
 * @returns {string} Parsed JavaScript, eols normalized, trailing spaces removed
 * @static
 *
 * @see {@link module:compiler~_compileJS|_compileJS}
 */
function compileJS (js, opts, type, userOpts) {
  if (typeof opts === 'string') {
    userOpts = type
    type = opts
    opts = {}
  }
  if (type && typeof type === 'object') {
    userOpts = type
    type = ''
  }
  if (!userOpts) userOpts = {}

  return _compileJS(js, opts || {}, type, userOpts.parserOptions, userOpts.url)
}

var CSS_SELECTOR = RegExp('([{}]|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + S_LINESTR, 'g')

/**
 * Parses styles enclosed in a "scoped" tag (`scoped` was removed from HTML5).
 * The "css" string is received without comments or surrounding spaces.
 *
 * @param   {string} tag - Tag name of the root element
 * @param   {string} css - The CSS code
 * @returns {string} CSS with the styles scoped to the root element
 */
function scopedCSS (tag, css) {
  var scope = ':scope'

  return css.replace(CSS_SELECTOR, function (m, p1, p2) {

    if (!p2) return m

    p2 = p2.replace(/[^,]+/g, function (sel) {
      var s = sel.trim()

      if (!s || s === 'from' || s === 'to' || s.slice(-1) === '%') {
        return sel
      }

      if (s.indexOf(scope) < 0) {
        s = tag + ' ' + s + ',[riot-tag="' + tag + '"] ' + s +
                            ',[data-is="' + tag + '"] ' + s
      } else {
        s = s.replace(scope, tag) + ',' +
            s.replace(scope, '[riot-tag="' + tag + '"]') + ',' +
            s.replace(scope, '[data-is="' + tag + '"]')
      }
      return s
    })

    return p1 ? p1 + ' ' + p2 : p2
  })
}

/**
 * Internal CSS compilation.
 * Runs any parser for style blocks and calls scopedCSS if required.
 *
 * @param   {string} css  - Raw CSS
 * @param   {string} tag  - Tag name to which the style belongs to
 * @param   {string} [type=css] - Parser name to run
 * @param   {object} [opts={}]  - User options
 * @returns {string} The compiled style, whitespace compacted and trimmed
 *
 * @throws  Will throw "CSS parser not found" if the CSS parser cannot be loaded.
 * @throws  Using the _scoped_ option with no tagName will throw an error.
 * @see {@link module:compiler.compileCSS|compileCSS}
 */
function _compileCSS (css, tag, type, opts) {
  var scoped = (opts || (opts = {})).scoped

  if (type) {
    if (type === 'scoped-css') {
      scoped = true
    } else if (type !== 'css') {

      var parser = parsers._req('css.' + type, true)
      css = parser(tag, css, opts.parserOpts || {}, opts.url)
    }
  }

  css = css.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()

  if (scoped) {
    if (!tag) {
      throw new Error('Can not parse scoped CSS without a tagName')
    }
    css = scopedCSS(tag, css)
  }
  return css
}

/**
 * Public API, wrapper of the internal {@link module:compiler~_compileCSS|_compileCSS}
 * function, rearranges its parameters and makes these can be omitted.
 *
 * - If the given code is empty or whitespaces only, returns an empty string
 * - Determines the parser to use, none by default
 * - Call the parser, if any
 * - Normalizes line-endings and trims trailing spaces
 * - Call the {@link module:compiler~scopedCSS|scopedCSS} function if required by the
 *   parameter _opts_
 *
 * @param   {string}  css    - Raw style block
 * @param   {string}  [type] - Parser name, one of {@link module:parsers.css|parsers.css}
 * @param   {object}  [opts] - User options
 * @param   {boolean} [opts.scoped]  - Convert to Scoped CSS (requires _tagName_)
 * @param   {string}  [opts.tagName] - Name of the root tag owner of the styles
 * @param   {string}  [opts.url=process.cwd] - Url of the .tag file
 * @param   {object}  [opts.parserOpts={}]   - Options for the parser
 * @returns {string} The processed style block
 * @static
 *
 * @see {@link module:compiler~_compileCSS|_compileCSS}
 */
function compileCSS (css, type, opts) {
  if (type && typeof type === 'object') {
    opts = type
    type = ''
  } else if (!opts) opts = {}

  return _compileCSS(css, opts.tagName, type, opts)
}

/**
 * The "defer" attribute is used to ignore `script` elements (useful for SSR).
 *
 * This regex is used by {@link module:compiler~getCode|getCode} to check and by
 * {@link module:compiler.compile|compile} to remove the keyword `defer` from
 * `<script>` tags.
 * @const {RegExp}
 */
var DEFER_ATTR = /\sdefer(?=\s|>|$)/i

/**
 * Matches attributes 'type=value', for `<script>` and `<style>` tags.
 * This regex does not expect expressions nor escaped quotes.
 * @const {RegExp}
 */
var TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i

/**
 * Source string for creating generic regexes matching pairs of `attribute=value`. Used
 * by {@link module:compiler~getAttrib|getAttrib} for the `option`, `src`, and `charset`
 * attributes, handles escaped quotes and unquoted JSON objects with no nested brackets.
 * @const {string}
 */
var MISC_ATTR = '\\s*=\\s*(' + S_STRINGS + '|{[^}]+}|\\S+)'

/**
 * Matches the last HTML tag ending a line. This can be one of:
 * - self-closing tag
 * - closing tag
 * - tag without attributes
 * - void tag with (optional) attributes
 *
 * Be aware that this regex still can be fooled by strange code like:
 * ```js
 * x <y -y>
 *  z
 * ```
 * @const {RegExp}
 */
var END_TAGS = /\/>\n|^<(?:\/?-?[A-Za-z][-\w\xA0-\xFF]*\s*|-?[A-Za-z][-\w\xA0-\xFF]*\s+[-\w:\xA0-\xFF][\S\s]*?)>\n/

/**
 * Encloses the given string in single quotes.
 *
 * 2016-01-18: we must escape single quotes and backslashes before quoting the
 * string, but there's no need to care about line-endings unless is required,
 * as each submodule normalizes the lines.
 *
 * @param   {string} s - The unquoted, source string
 * @param   {number} r - If 1, escape embeded EOLs in the source
 * @returns {string} Quoted string, with escaped single-quotes and backslashes.
 */
function _q (s, r) {
  if (!s) return "''"
  s = SQ + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + SQ
  return r && ~s.indexOf('\n') ? s.replace(/\n/g, '\\n') : s
}

/**
 * Generates code to call the `riot.tag2` function with the processed parts.
 *
 * @param   {string} name - The tag name
 * @param   {string} html - HTML (can contain embeded eols)
 * @param   {string} css  - Styles
 * @param   {string} attr - Root attributes
 * @param   {string} js   - JavaScript "constructor"
 * @param   {string} imports - Code containing 'import' statements
 * @param   {object} opts - Compiler options
 * @returns {string} Code to call `riot.tag2`
 */
function mktag (name, html, css, attr, js, imports, opts) {
  var
    c = opts.debug ? ',\n  ' : ', ',
    s = '});'

  if (js && js.slice(-1) !== '\n') s = '\n' + s

  return imports + 'riot.tag2(\'' + name + SQ +
    c + _q(html, 1) +
    c + _q(css) +
    c + _q(attr) + ', function(opts) {\n' + js + s
}

/**
 * Used by the main {@link module:compiler.compile|compile} function, separates the
 * HTML and JS parts of the tag. The last HTML element (can be a `<script>` block) must
 * terminate a line.
 *
 * @param   {string} str - Tag content, normalized, without attributes
 * @returns {Array} Parts: `[HTML, JavaScript]`
 */
function splitBlocks (str) {
  if (/<[-\w]/.test(str)) {
    var
      m,
      k = str.lastIndexOf('<'),
      n = str.length

    while (~k) {
      m = str.slice(k, n).match(END_TAGS)
      if (m) {
        k += m.index + m[0].length
        return [str.slice(0, k), str.slice(k)]
      }
      n = k
      k = str.lastIndexOf('<', k - 1)
    }
  }
  return ['', str]
}

/**
 * Returns the value of the 'type' attribute, with the prefix "text/" removed.
 *
 * @param   {string} attribs - The attributes list
 * @returns {string} Attribute value, defaults to empty string
 */
function getType (attribs) {
  if (attribs) {
    var match = attribs.match(TYPE_ATTR)

    match = match && (match[2] || match[3])
    if (match) {
      return match.replace('text/', '')
    }
  }
  return ''
}

/**
 * Returns the value of any attribute, or the empty string for missing attribute.
 *
 * @param   {string}  attribs - The attribute list
 * @param   {string}  name    - Attribute name
 * @returns {string} Attribute value, defaults to empty string
 */
function getAttrib (attribs, name) {
  if (attribs) {
    var match = attribs.match(RegExp('\\s' + name + MISC_ATTR, 'i'))

    match = match && match[1]
    if (match) {
      return (/^['"]/).test(match) ? match.slice(1, -1) : match
    }
  }
  return ''
}

/**
 * Unescape any html string
 * @param   {string} str escaped html string
 * @returns {string} unescaped html string
 */
function unescapeHTML (str) {
  return str
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, '\'')
}

/**
 * Gets the parser options from the "options" attribute.
 *
 * @param   {string} attribs - The attribute list
 * @returns {object} Parsed options, or null if no options
 */
function getParserOptions (attribs) {
  var opts = unescapeHTML(getAttrib(attribs, 'options'))

  return opts ? JSON.parse(opts) : null
}

/**
 * Gets the parsed code for the received JavaScript code.
 * The node version can read the code from the file system. The filename is
 * specified through the _src_ attribute and can be absolute or relative to _base_.
 *
 * @param   {string} code    - The unprocessed JavaScript code
 * @param   {object} opts    - Compiler options
 * @param   {string} attribs - Attribute list
 * @param   {string} base    - Full filename or path of the file being processed
 * @returns {string} Parsed code
 */
function getCode (code, opts, attribs, base) {
  var
    type = getType(attribs),
    src  = getAttrib(attribs, 'src'),
    jsParserOptions = extend({}, opts.parserOptions.js)

  if (src) {
    if (DEFER_ATTR.test(attribs)) return false

    var charset = getAttrib(attribs, 'charset'),
      file = path.resolve(path.dirname(base), src)

    code = require('fs').readFileSync(file, charset || 'utf8')
  }

  return _compileJS(
          code,
          opts,
          type,
          extend(jsParserOptions, getParserOptions(attribs)),
          base
        )
}

/**
 * Gets the parsed styles for the received CSS code.
 *
 * @param   {string} code    - Unprocessed CSS
 * @param   {object} opts    - Compiler options
 * @param   {string} attribs - Attribute list
 * @param   {string} url     - Of the file being processed
 * @param   {string} tag     - Tag name of the root element
 * @returns {string} Parsed styles
 */
function cssCode (code, opts, attribs, url, tag) {
  var
    parserStyleOptions = extend({}, opts.parserOptions.style),
    extraOpts = {
      parserOpts: extend(parserStyleOptions, getParserOptions(attribs)),
      scoped: attribs && /\sscoped(\s|=|$)/i.test(attribs),
      url: url
    }

  return _compileCSS(code, tag, getType(attribs) || opts.style, extraOpts)
}

/**
 * Runs the external HTML parser for the entire tag file
 *
 * @param   {string} html - Entire, untouched html received for the compiler
 * @param   {string} url  - The source url or file name
 * @param   {string} lang - Parser's name, one of {@link module:parsers.html|parsers.html}
 * @param   {object} opts - Extra option passed to the parser
 * @returns {string} parsed html
 *
 * @throws  Will throw "Template parser not found" if the HTML parser cannot be loaded.
 */
function compileTemplate (html, url, lang, opts) {

  var parser = parsers._req('html.' + lang, true)
  return parser(html, opts, url)
}

var
  /**
   * Matches HTML elements. The opening and closing tags of multiline elements must have
   * the same indentation (size and type).
   *
   * `CUST_TAG` recognizes escaped quotes, allowing its insertion into JS strings inside
   * unquoted expressions, but disallows the character '>' within unquoted attribute values.
   * @const {RegExp}
   */
  CUST_TAG = RegExp(/^([ \t]*)<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^'"\/>]+(?:(?:@|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/
    .source.replace('@', S_STRINGS), 'gim'),
  /**
   * Matches `script` elements, capturing its attributes in $1 and its content in $2.
   * Disallows the character '>' inside quoted or unquoted attribute values.
   * @const {RegExp}
   */
  SCRIPTS = /<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi,
  /**
   * Matches `style` elements, capturing its attributes in $1 and its content in $2.
   * Disallows the character '>' inside quoted or unquoted attribute values.
   * @const {RegExp}
   */
  STYLES = /<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi

 /**
  * The main compiler processes all custom tags, one by one.
  *
  * - Sends the received source to the html parser, if any is specified
  * - Normalizes eols, removes HTML comments and trim trailing spaces
  * - Searches the HTML elements and extract: tag name, root attributes, and content
  * - Parses the root attributes. Found expressions are stored in `pcex[]`
  * - Removes _HTML_ comments and trims trailing whitespace from the content
  * - For one-line tags, process all the content as HTML
  * - For multiline tags, separates the HTML from any untagged JS block and, from
  *   the html, extract and process the `style` and `script` elements
  * - Parses the remaining html, found expressions are added to `pcex[]`
  * - Parses the untagged JavaScript block, if any
  * - If the `entities` option was received, returns an object with the parts,
  *   if not, returns the code neccesary to call the `riot.tag2` function to
  *   create a Tag instance at runtime.
  *
  * In .tag files, a custom tag can span multiple lines, but there should be no other
  * elements at the start of the line (comments inclusive). Custom tags in html files
  * don't have this restriction.
  *
  * @param   {string} src       - String with zero or more custom riot tags
  * @param   {Object} [opts={}] - User options
  * @param   {string} [url=./.] - Filename or url of the file being processed
  * @returns {string} JavaScript code to build a Tag by the `riot.tag2` function
  * @static
  */
function compile (src, opts, url) {
  var
    parts = [],
    included,
    defaultParserptions = {

      template: {},
      js: {},
      style: {}
    }

  if (!opts) opts = {}

  opts.parserOptions = extend(defaultParserptions, opts.parserOptions || {})

  included = opts.exclude
    ? function (s) { return opts.exclude.indexOf(s) < 0 } : function () { return 1 }

  if (!url) url = process.cwd() + '/.'

  var _bp = brackets.array(opts.brackets)

  if (opts.template) {
    src = compileTemplate(src, url, opts.template, opts.parserOptions.template)
  }

  src = cleanSource(src)
    .replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {
      var
        jscode = '',
        styles = '',
        html = '',
        imports = '',
        pcex = []

      pcex._bp = _bp

      tagName = tagName.toLowerCase()

      attribs = attribs && included('attribs')
        ? restoreExpr(
            parseAttribs(
              splitHtml(attribs, opts, pcex),
            pcex),
          pcex) : ''

      if ((body || (body = body2)) && /\S/.test(body)) {

        if (body2) {

          if (included('html')) html = _compileHTML(body2, opts, pcex)
        } else {

          body = body.replace(RegExp('^' + indent, 'gm'), '')

          body = body.replace(STYLES, function (_m, _attrs, _style) {
            if (included('css')) {
              styles += (styles ? ' ' : '') + cssCode(_style, opts, _attrs, url, tagName)
            }
            return ''
          })

          body = body.replace(SCRIPTS, function (_m, _attrs, _script) {
            if (included('js')) {
              var code = getCode(_script, opts, _attrs, url)

              if (code === false) return _m.replace(DEFER_ATTR, '')
              if (code) jscode += (jscode ? '\n' : '') + code
            }
            return ''
          })

          var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''))

          if (included('html')) {
            html = _compileHTML(blocks[0], opts, pcex)
          }

          if (included('js')) {
            body = _compileJS(blocks[1], opts, null, null, url)
            imports = compileImports(jscode)
            jscode  = rmImports(jscode)
            if (body) jscode += (jscode ? '\n' : '') + body
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

      return mktag(tagName, html, styles, attribs, jscode, imports, opts)
    })

  if (opts.entities) return parts

  if (opts.debug && url.slice(-2) !== '/.') {
    if (/^[\\/]/.test(url)) url = path.relative('.', url)
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
  version: 'v2.5.2'
}
