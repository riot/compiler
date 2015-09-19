
/*#norm:
  -----------------------------------------------------------------------------
  riot-tmpl/lib/brackets.js

  brackets function returns a string or regex based on current riot brackets.
  With a numeric parameter...

    0,1 - the current left (0) or right (1) current brackets characters.
    2,3 - the current left (2) or right (3) escaped brackets characters.
      4 - regex based on `/{|}/g`, matches any bracket.
      5 - regex based on `/\\({|})/g`, matches escaped brackets.
      6 - regex for test expression existence.

  With a regex, returns the original regex if the current brackets are the defaults,
  or a new regex with the default brackets replaced by the current, custom brackets.
  **WARNING:** recreated regexes discards the /i and /m flags.
*/

// IIFE
var brackets = (function () {

  // Cache on closure, initialized on first use and on bracket changes
  var
    cachedBrackets = '',    // full brackets string in use, for change detection
    regex,                  // for regExp convertion based on current brackets
    pairs,                  // cache for custom brackets and regexps
    _b = [
      '{', '}',
      '{', '}',
      /{|}/g,
      /\\({|})/g,
      /\{[^}]*}/,
      /(\\?)({)/g
    ],
    REGLOB = 'g'

  /*
    Dummy function, for default brackets
  */
  function reFn0(e) {
    return e
  }

  /*
    Rewrite regexp with the default brackets replaced with the custom ones.
    Let the user choose whether to double escape characters.
  */
  function reFn1(e) {
    return new RegExp(
      e.source.replace(/[{}]/g, function (b) { return pairs[b === '{' ? 2 : 3] }),
      e.global ? REGLOB : ''
    )
  }

  /*
    Finish the array with the regexp which seeks closing brackets
  */
  function reFn8(b) {
    b[8] = regExp('(\\\\?)(?:([[({])|(' + b[3] + '))|' + _re.S_QBSRC, REGLOB)
    return b
  }

  // Initialize to defaults
  _b.re = regex = reFn0
  pairs = reFn8(_b)

  /*
    Create an array with strings and regexps based on the current brackets.
    Array have the `re` function, for regexp convertion.
   */
  function _array(bpair) {

    if (bpair && bpair !== '{ }') {
      // Save the new unescaped/escaped brackets
      var arr = bpair.split(' ')
                .concat(bpair.replace(/(?=[[$\.?+*()|^\\])/g, '\\').split(' '))

      if (arr.length !== 4 || /[<>\w'"]/.test(bpair)) {
        throw new Error('Unsupported brackets: "' + bpair + '"')
      }
      arr[4] = reFn1(_b[4])
      arr[5] = reFn1(_b[5])
      arr[6] = reFn1(arr[1].length > 1 ? /{.*}/ : _b[6])
      arr[7] = reFn1(_b[7])
      arr.re = reFn1
      return reFn8(arr)
    }
    return _b
  }

  /*
    Splits the received string in its template text and expression parts.
  */
  var
    FINDBRACES = {
      '(': regExp('([()])|'   + _re.S_QBSRC, REGLOB),
      '[': regExp('([[\\]])|' + _re.S_QBSRC, REGLOB),
      '{': regExp('([{}])|'   + _re.S_QBSRC, REGLOB)
    }

  function _split(str, _b) {
    /*
      About inner unescaped (and unbalanced) brackets detection

      Template text is easy: closing brackets are ignored, all we have to do is find
      the first unescaped bracket. The real work is in the expressions...

      Expressions are not so easy. We can already ignore opening brackets, but finding
      the correct closing bracket is tricky.
      Think about literal strings and regexps, they can contain almost any combination
      of characters. We can't deal with these complexity with our regexps, so let's
      hide and ignore these*. From there, all we need is to detect the bracketed parts
      and skip them, as they contains most of common chars used by riot brackets.
      With that, we have a 90% reliability in the detections, although (hope few) some
      custom brackets still requires to be escaped (e.g. `<< x \\>> 1 >>`) :(

      *The template comes with regexps hidden, and haveQBlock hides qstrings here.
    */
    if (!_b) _b = pairs

    var
      parts = [],                 // holds the resulting parts
      start,                      // start position of current template or expression
      match,                      // reused by both outer and nested searches
      pos,                        // current position (exec() result)
      isexpr,                     // we are in ttext (0) or expression (1)
      re = _b[7]                  // start with opening bracket

    start = isexpr = 0

    while (match = re.exec(str)) {

      pos = match.index

      // We are in expression.
      // All brackets inside qblocks, and js braces by pairs, are ignored.
      // This works even if the opening bracket of riot is the same as a js bracket,
      // because we already skipped the first one (that switched to expression mode).

      // $1: optional escape character
      // $2: opening js bracket `{[(`
      // $3: closing riot bracket
      // $4, $5: qblocks

      if (isexpr) {

        if (match[2]) {                         // if we have a js opening bracket
          // Skip bracketed block, pos is shifted by the escape char length
          re.lastIndex = skipBraces(match[2], re.lastIndex)
          continue
        }

        if (!match[3])
          continue
      }

      // At this point, we expect an _unescaped_ openning bracket in $2 for text mode,
      // or a closing bracket in $3 for expression.

      if (!match[1]) {                          // ignore it if have an escape char
        unescapeStr(str.slice(start, pos))      // push part, even if empty
        start = re.lastIndex                    // next position is the new start
        re = _b[7 + (isexpr ^= 1)]              // switch mode and swap regexp
        re.lastIndex = start                    // update the regexp pointer
      }
    }

    if (start < str.length) {                   // push remaining part, if we have one
      unescapeStr(str.slice(start))
    }

    return parts

    /*
      ### Inner Helpers
    */

    // Unescape escaped brackets and store the qstring in the parts array.
    function unescapeStr(str) {
      parts.push(str && str.replace(_b[5], '$1'))
    }

    // Find the js closing bracket for the current opening bracket.
    // Skips strings, regexp, and inner brackets.
    function skipBraces(ch, pos) {
      var match,
          recch = FINDBRACES[ch],
          level = 1
      recch.lastIndex = pos

      while (match = recch.exec(str)) {
        if (match[1] &&
          !(match[1] === ch ? ++level : --level)) break
      }
      return match ? recch.lastIndex : str.length
    }
  }

  /*
    Exposed brackets() function, for track bracket changes.
   */
  function _brackets(reOrIdx) {
    var s = riot && riot.settings.brackets || ''

    // recreate cache if we have new brackets
    if (cachedBrackets !== s) {
      cachedBrackets = s
      pairs = _array(s)
      regex = pairs.re
    }

    return reOrIdx instanceof RegExp ? regex(reOrIdx) : pairs[reOrIdx]
  }

  //# for use by riot only
  _brackets.array = _array
  _brackets.split = _split

  return _brackets

})()
