/*#norm:
  -----------------------------------------------------------------------------
  riot-tmpl/lib/tmpl.js
*/

// IIFE for tmpl()
var tmpl = (function () {

  var cache = {
      '@01': function () { return 'number' }
    },

    _GLOBAL = typeof window !== 'object' ? global : window


  /*
    ### TEMPLATE EVALUATION (Public Entry Point)
  */

  /**
   * Exposed tmpl() function.
   * Return the template value of the cache, render with data.
   * The expressions in the template were replaced with markers pointing to functions
   * in the cache.
   *
   * @param {string} str - The unprocessed template with zero or more expressions
   * @param {Object} data - For setting the context
   * @returns {*} - Raw value of the expression, or the processed template
   * @private
   */
  function _tmpl(str, data) {
    if (!str) return str

    // For shorthand list cache[n] is an array
    var idx
    if (str[0] === '#' && (idx = str.match(/^#(@\d+)#$/))) {
      var v,
          fn = cache(idx[1])
      if (Array.isArray(fn))
        v = shList(data, _GLOBAL, fn)     // shorthand list
      else
        try {
          v = fn.call(data, _GLOBAL)      // raw value
        } catch (e) {
          errOut(e, idx[1], data)
        }
      return v
    }

    // Mixed text/expressions
    return str.replace(/#(@\d+)#/g, function (_, n) {
      var s
      try {
        s = cache[n].call(data, _GLOBAL)  // template text
      } catch (e) {
        errOut(e, n, data)
      }
      return s || s === 0 ? s : ''
    })
  }

  /*
    Output an error message, throws for missing expressions.
    outputErrors defaults to false for compatibility.
  */
  function errOut(e, n, D, cs) {
    var s = 'riot: '

    if (n && !cache[n])
      throw new Error(s + 'Missing expression "' + n + '"')

    if (!riot || riot.settings.outputErrors) {
      if (D && D.root) s += ' in ' + D.root.tagName
      if ('_id' in D) s += ' [' + D._id + ']'
      if (cs) s += ' shorthand `' + cs + '`'
      console.error(s + ' : ' + e.message)
    }
  }

  /*
    Shorthand list parser called with `[key,expr,key,expr,...]`
  */
  function shList(data, list) {
    var cs = ''

    for (var i = 0; i < list.length; i += 2) {
      try {
        if (list[i].call(data, _GLOBAL))
          cs += (cs ? ' ' : '') + list[i + 1]
      } catch (e) {
        errOut(e, 0, data, list[i + 1])
      }
    }
    return cs
  }

  /**
   * Inserts getters into the cache.
   *
   * @param {Object} pcex - kay-value is hash-function
   * @private
   */
  _tmpl.insert = function _insert(pcex) {
    for (hash in pcex) {  // eslint-disable-line guard-for-in
      cache[hash] = pcex[hash]
    }
  }

  /*
    Extract the parts from an each attribute value.
    Used by browser/tag/each.js
  */
  _tmpl.loopKeys = function _loopKeys(expr) {
    var m = expr.match(/^([^,]+),([^,]*),(#@\d+#)/)  // matches 'item,i,#@n#'
    return m ? { key: m[1], pos: m[2], val: m[3] } : { val: expr }
  }


  //---------------------------------------------------------------
  // Expressions compilation follows
  // This code is not necessary for pure precompiled expressions

  /*
    ### GETTER CREATION & PARSERS
  */

  /**
   * Parses an expression or template with zero or more expressions.
   *
   * @param   { string } str - Raw template string without comments.
   * @param   { Object } [opts] - User options.
   * @param   { Array } [pcex] - Strings of hash:function pairs for the getters.
   * @param   { Function } [fn] - Function to preprocess expressions.
   * @returns { string } The processed template, ready for insertion in the tag definition.
   * @private
   */
  _tmpl.parse = function _parse(str, opts, pcex, fn) {

    // Empty strings never get here. This function is only called from _tmpl,
    // and _tmpl returns falsy values before calling here.

    //#if DEBUG
    //if (console && console.info) console.info(' in: \'' +
    //  str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '\'')
    //#endif
    var
      re = /^(?:\^\s*)?([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S+)$/,
      mm,
      ex,
      hash,
      parts = brackets.split(str, opts && opts._b)

    //console.log('*** FROM split: ' + JSON.stringify(parts))

    //#if DEBUG
    //if (console && console.info) console.info('OUT: ' +
    //  str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'))
    //#endif

    for (var i = 1; i < parts.length; i += 2) {
      ex = parts[i].trim()
      if (!ex) continue

      if ((mm = ex.match(re)) &&
          (mm[2] || (/\beach\s*=\s*['"]?$/i).test(parts[i - 1]))) {
        // { item,i in items } => item,i,#@00#
        parts[i - 1] += mm[1] + ',' + (mm[2] || '') + ','
        ex = mm[3]
      }
      else if (ex[0] === '^') {
        ex = ex.slice(1)
      }
      else if (fn) {
        ex = fn(ex, opts)
      }

      parts[i] = '#' + (hash = hashCode(ex)) + '#'
      ex = parseExpr(ex)

      // pcex is received from the compiler, returns strings to create an object
      if (pcex)
        pcex.push('"' + hash + '":function(G){return ' + ex + '}')
      else
        cache[hash] = new Function('G', 'return ' + ex + ';')
    }

    return parts.join('')
  }

  /*
    Adapted from http://www.partow.net/programming/hashfunctions/index.html
    SDBMHash function using native js signed integers.
  */
  function hashCode(str) {
    var i, hash

    for (i = hash = 0; i < str.length; ++i) {
      hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash
    }
    return hash < 0 ? '@0' + hash * -1 : '@' + hash   // no sign
  }

  // For parseExpr
  var
    RE_QBLOCK = regExp(_re.S_QBSRC, 'g'),
    RE_QBMARK = /\uFFF1(\d+)~/g,    // qstring (or regexp) marker, $1: array index
    CH_QBLOCK = '\uFFF1'            // invalid Unicode code point for hide qblock

  /**
   * Parses `{ expression }` or `{ name: expression, ... }`
   *
   * For simplicity, and due to RegExp limitations, riot supports a limited subset (closer
   * to CSS1 that CSS2) of the full w3c/html specs for non-quoted identifiers of shorthand
   * names. This simplified regexp is used for the recognition:
   *
   *   `-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*`
   *
   * The regexp accept all ISO-8859-1 characters that are valid within an html identifier.
   * The names must begin with one underscore (\x5F), one alphabetic ascii (A-Z, a-z),
   * or one ISO-8859-1 character in the range 160 to 255, optionally prefixed with one
   * dash (\x2D).
   *
   * NOTE: Although you can use Unicode code points beyond \u00FF by quoting the names
   *       (not recommended), only use whitespace as separators since, within names,
   *       riot converts these into spaces.
   *
   * @see {@link http://www.w3.org/TR/CSS21/grammar.html#scanner}
   *      {@link http://www.w3.org/TR/CSS21/syndata.html#tokenization}
   *
   * @param   { string } expr - The expression, without brackets
   * @returns { string } - Code for evaluate the expression
   */
  function parseExpr(expr) {
    /*
      Replace non-empty qstrings with a marker that includes its original position
      as an index into the array of replaced qstrings.
      By hiding regexps and strings here we avoid complications through all the
      code without affecting the logic.

      Converts inner whitespace into compact-spaces and trims the space surrounding
      the expression and some inner tokens, mainly brackets and separators.
      We need convert embedded '\r' and '\n' as these chars break the evaluation.

      WARNING:
        Trim and compact is not strictly necessary, but it allows optimized regexps.
        Many regexps in tmpl code depend on this, so do not touch the next line
        until you know how, and which, regexps are affected.
    */
    var qstr = []

    expr = expr
          .replace(RE_QBLOCK, function (match, div) {   // hide qstrings & regexes
            return match.length > 2 && !div ?
              CH_QBLOCK + (qstr.push(match) - 1) + '~' : match
          })
          .replace(/\s+/g, ' ').trim()
          .replace(/\ ?([[\({},?\.:])\ ?/g, '$1')

    if (expr) {

      var list = getCSList(expr, qstr)

      // For shorthands, the code generated here returns an array with expr-name pairs
      expr = list ? '[' + list.join(',') + ']' : wrapExpr(expr)

      // Restore quoted strings and regexes
      if (qstr[0]) {
        expr = expr.replace(RE_QBMARK, function (_, pos) {
          return qstr[pos].replace(/\r/g, '\\r').replace(/\n/g, '\\n')
        })
      }
    }
    return expr
  }

  // Matches the `name:` part of a class shorthand, $1 is a qstring index
  var CS_NAME = regExp(
        '^(?:(-?[_A-Za-z\\xA0-\\xFF][-\\w\\xA0-\\xFF]*)|' + RE_QBMARK.source + '):'
      )

  /*
    Check if expression is a shorthand list, if so, returns a list with
    `expression,"name"` elements.

    @param {string} expr - The preprocessed expression.
    @returns {Array|number} - Resulting array, or zero if expr is not a shorthand list.
  */
  function getCSList(expr) {
    var list = [],
        cnt = 0,
        gre = RegExp,
        match

    // Try to match the first name testing `match !== null && match.index === 0`
    while (expr &&
          (match = expr.match(CS_NAME)) &&
          !match.index                          // index > 0 means error
      ) {
      var key = match[2] ? qexpr[match[2]].slice(1, -1).trim() : match[1],
          jsb,
          re = /,|([[{(])|$/g

      // Search the next comma, outside brackets, or the end of expr.
      // If js bracket is found ($1), skip the bracketed part.

      expr = gre.rightContext
      while (jsb = (match = re.exec(expr))[1]) {
        var lv = 1,
            rr = jsb === '(' ? /[()]/g : jsb === '[' ? /[[\]]/g : /[{}]/g

        rr.lastIndex = re.lastIndex
        while (lv && (match = rr.exec(expr))) {
          match[0] === jsb ? ++lv : --lv
        }
        if (lv) return 0              // unbalanced braces
        re.lastIndex = rr.lastIndex
      }

      jsb = expr.slice(0, match.index)
      expr = gre.rightContext

      list[cnt++] = 'function(){return ' + wrapExpr(jsb) + '},"' + key + '"'
    }

    return cnt && list
  }


  /*
    ### WRAPPERS
  */

  // Matches a var name, excludes literal object keys.
  // $1 is the match of the lookehead used for detect the var name ($2)
  var JS_VARNAME =
    /[,{][$\w]+:|(^ *|[^$\w\.])(?!(?:this|global|typeof|true|false|null|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g

  /**
   * Generates code to evaluate an expression avoiding breaking on undefined vars.
   *
   * @param {string} expr - The expression
   * @returns {string} - The processed expression.
   */
  function wrapExpr(expr) {

    return expr.replace(JS_VARNAME, function (match, p, mvar) {
      if (mvar)
        match = p + (mvar === 'window' ? 'G' : '("' + mvar + '"in this?this:G).' + mvar)
      return match
    })
  }

  return _tmpl

})()
