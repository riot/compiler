/**
 * @module brackets
 *
 * `brackets         ` Returns a string or regex based on its parameter
 * `brackets.settings` Mirrors the `riot.settings` object (use brackets.set in new code)
 * `brackets.set     ` Change the current riot brackets
 */

//#set $_RIX_TEST  = 4
//#set $_RIX_ESC   = 5
//#set $_RIX_OPEN  = 6
//#set $_RIX_CLOSE = 7
//#set $_RIX_PAIR  = 8
//#set $_RIX_LOOP  = 9
//#set $_RIX_RAW   = 10
//#ifndef $_RIX_TEST
var
  $_RIX_TEST  = 4,  // DONT'T FORGET SYNC THE #set BLOCK!!!
  $_RIX_ESC   = 5,
  $_RIX_OPEN  = 6,
  $_RIX_CLOSE = 7,
  $_RIX_PAIR  = 8,
  $_RIX_LOOP  = 9,
  $_RIX_RAW   = 10
//#endif

var brackets = (function (UNDEF) {

  // Closure data
  // --------------------------------------------------------------------------
  var
    REGLOB  = 'g',

  // `MLCOMMS` - Multiline comments in almost all their forms<br>
  // `STRINGS` - Quoted strings. Don't care about inner eols<br>

    MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
    STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,

  // `S_QBSRC` - `STRINGS` combined with regex sources matching division operators
  // and literal regexes, for use with the RegExp ctor.
  // The resulting regex captures in `$1` and `$2` a single slash, depending if it
  // matches a division operator ($1) or a regex ($2).

    S_QBSRC = STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source,

  // The predefined riot brackets
    DEFAULT = '{ }',

  // Regexes for matching JavaScript brackets out of quoted strings and regexes.
  // These are heavy, but their performance is acceptable.

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBSRC, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBSRC, REGLOB),
      '{': RegExp('([{}])|'   + S_QBSRC, REGLOB)
    }

  // Variable information about the current brackets state, initialized on first use
  // and on bracket changes.
  var
    cachedBrackets = UNDEF,       // full brackets string in use, for change detection
    _regex,                       // for regex convertion of default brackets
    _pairs = []                   // pre-made string and regexes for current brackets

  // Private functions
  // --------------------------------------------------------------------------

  /**
   * Dummy function, returns the same regex
   * @param   {RegExp} re RegExp instance
   * @returns {RegExp}    The same regex
   */
  function _loopback(re) { return re }

  /**
   * Rewrite regex with the default brackets replaced with the custom ones.
   * @param   {RegExp} re - RegExp with the default riot brackets
   * @param   {Array}  bp - Custom brackets to replace with
   * @returns {RegExp} - The new regex with the default brackets replaced.
   * @private
   */
  function _rewrite(re, bp) {
    // istanbul ignore next
    if (!bp) bp = _pairs
    return new RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  /**
   * Creates an array with strings and regexes based on the received brackets.
   *
   * @param   {string} pair - String with the brackets pair
   * @returns {Array} - Array with info for the given brackets
   * @private
   */
  function _create(pair) {
    var
      cvt,
      arr = pair.split(' ')

    if (pair === DEFAULT) {
      arr[2] = arr[0]
      arr[3] = arr[1]
      cvt = _loopback
    }
    else {
      // istanbul ignore next
      if (arr.length !== 2 || /[\x00-\x1F<>a-zA-Z0-9'",;\\]/.test(pair)) {
        throw new Error('Unsupported brackets "' + pair + '"')
      }
      arr = arr.concat(pair.replace(/(?=[[\]()*+?.^$|])/g, '\\').split(' '))
      cvt = _rewrite
    }
    // istanbul ignore next
    arr[$_RIX_TEST] = cvt(arr[1].length > 1 ? /{[\S\s]*?}/ : /{[^}]*}/, arr)
    arr[$_RIX_ESC] = cvt(/\\({|})/g, arr)
    arr[$_RIX_OPEN] = cvt(/(\\?)({)/g, arr) // for _split()
    arr[$_RIX_CLOSE] = RegExp('(\\\\?)(?:([[({])|(' + arr[3] + '))|' + S_QBSRC, REGLOB)
    arr[$_RIX_PAIR] = pair
    return arr
  }

  /**
   * Resets the _pairs array with strings and regexes based on its parameter.
   *
   * @param {string} pair - String with the brackets pair to set
   * @private
   */
   // istanbul ignore next
  function _reset(pair) {
    if (!pair) pair = DEFAULT

    if (pair !== _pairs[$_RIX_PAIR]) {
      _pairs = _create(pair)
      _regex = pair === DEFAULT ? _loopback : _rewrite
      _pairs[$_RIX_LOOP] = _regex(/^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/)
      _pairs[$_RIX_RAW] = _regex(/(^|[^\\]){=[\S\s]*?}/)
      _brackets._rawOffset = _pairs[0].length
    }
    cachedBrackets = pair  // always set these
  }

  // "Exported" functions
  // --------------------------------------------------------------------------

  /**
   * The main function.<br>
   * With a numeric parameter, returns the current left (0) or right (1) brackets
   * characters.
   * With a regex, returns the original regex if the current brackets are the defaults,
   * or a new one with the default brackets replaced by the current custom brackets.
   * @param   {RegExp|number} reOrIdx - As noted above
   * @returns {RegExp|string} - Based on the received parameter
   */
   // istanbul ignore next
  function _brackets(reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _pairs[reOrIdx]
  }

  /**
   * Splits the received string in its template text and expression parts using
   * balanced brackets detection to avoid require escaped brackets from users.<br>
   * For internal use by tmpl and the riot-compiler.
   * @param   {string} str    - Template source to split, can be one expression
   * @param   {number} [tmpl] - 1 if called from tmpl()
   * @param   {Array}  [_bp]  - Info of custom brackets to use
   * @returns {Array} - Array containing alternate template text and expressions.
   *   If str was one unique expression, returns two elements: ["", expression].
   */
  _brackets.split = function split(str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) _bp = _pairs

    // Template text is easy: closing brackets are ignored, all we have to do is find
    // the first unescaped bracket. The real work is with the expressions...
    //
    // Expressions are not so easy. We can already ignore opening brackets, but finding
    // the correct closing bracket is tricky.
    // Strings and regexes can contain almost any combination of characters and we
    // can't deal with these complexity with our regexes, so let's hide and ignore
    // these. From there, all we need is to detect the bracketed parts and skip
    // them, as they contains most of the common characters used by riot brackets.
    // With that, we have a 90% reliability in the detection, although (hope few) some
    // custom brackets still requires to be escaped.
    var
      parts = [],                 // holds the resulting parts
      match,                      // reused by both outer and nested searches
      isexpr,                     // we are in ttext (0) or expression (1)
      start,                      // start position of current template or expression
      pos,                        // current position (exec() result)
      re = _bp[$_RIX_OPEN]        // start with *updated* opening bracket

    isexpr = start = re.lastIndex = 0       // re is reused, we must reset lastIndex

    while (match = re.exec(str)) {

      pos = match.index

      if (isexpr) {
        // $1: optional escape character,
        // $2: opening js bracket `{[(`,
        // $3: closing riot bracket,
        // $4 & $5: qblocks

        if (match[2]) {                     // if have a javascript opening bracket,
          re.lastIndex = skipBraces(match[2], re.lastIndex)
          continue                          // skip the bracketed block and loop
        }

        if (!match[3])                      // if don't have a closing bracket
          continue                          // search again
      }

      // At this point, we expect an _unescaped_ openning bracket in $2 for text,
      // or a closing bracket in $3 for expression.

      if (!match[1]) {                      // ignore it if have an escape char
        unescapeStr(str.slice(start, pos))  // push part, even if empty
        start = re.lastIndex                // next position is the new start
        re = _bp[$_RIX_OPEN + (isexpr ^= 1)] // switch mode and swap regexp
        re.lastIndex = start                // update the regex pointer
      }
    }

    if (str && start < str.length) {        // push remaining part, if we have one
      unescapeStr(str.slice(start))
    }

    return parts

    // Inner Helpers for _split() -----

    // Store the string in the array `parts`.
    // Unescape escaped brackets from expressions and, if we are called from
    // tmpl, from the HTML part too.
    function unescapeStr(str) {
      if (tmpl || isexpr)
        parts.push(str && str.replace(_bp[$_RIX_ESC], '$1'))
      else
        parts.push(str)
    }

    // Find the js closing bracket for the current block.
    // Skips strings, regexes, and other inner blocks.
    function skipBraces(ch, pos) {
      var
        match,
        recch = FINDBRACES[ch],
        level = 1
      recch.lastIndex = pos

      while (match = recch.exec(str)) {
        // istanbul ignore next
        if (match[1] &&
          !(match[1] === ch ? ++level : --level)) break
      }
      // istanbul ignore next
      return match ? recch.lastIndex : str.length
    }
  }

  /**
   * Returns an array with brackets information, defaults to the current brackets.
   * WARNIG: This function is for internal use, can returns a shared array.
   *
   * @param   {string} [pair] - If used, set the current brackets to this pair
   * @param   {number} [lock] - 1 to lock the brackets
   * @returns {Array} - Brackets array in internal format
   */
  _brackets.array = function array(pair) {
    return _create(pair || cachedBrackets)   // fix #1314
  }

  // Inmediate execution
  // --------------------------------------------------------------------------

  // Mirrors the `riot.settings`, you can assign this if riot is not in context
  var _settings
  // istanbul ignore next
  function _setSettings(o) {
    var b
    o = o || {}
    b = o.brackets
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function () { return cachedBrackets },
      enumerable: true
    })
    _settings = o
    _reset(b)
  }
  // istanbul ignore next
  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function () { return _settings }
  })

  /* istanbul ignore next: in the node version riot is not in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {}
  _brackets.set = _reset                // or better use this

  // Public properties, shared with `tmpl` and/or the riot compiler
  _brackets.R_STRINGS = STRINGS
  _brackets.R_MLCOMMS = MLCOMMS
  _brackets.S_QBLOCKS = S_QBSRC

  return _brackets

})()
