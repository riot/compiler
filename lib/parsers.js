/**
 * The compiler.parsers object holds the compiler's predefined parsers
 * @module
 */
var REQPATH = './parsers/'

// Passtrough for the internal `none` and `javascript` parsers
function _none (src) {
  return src
}

// Initialize the cache with parsers that cannot be required
var _mods = { none: _none, javascript: _none }

/**
 * Returns a parser instance by its name, requiring the module without generating error.
 *
 * Public through the `parsers._req` function.
 *
 * @param   {string} name  - The parser's name, as registered in the parsers object
 * @param   {string} [req] - To be used by require(). Defaults to parser's name
 * @returns {Function}       The parser instance, null if the parser is not found.
 */
function _req (name, req) {
  var mod

  if (name in _mods) {
    mod = _mods[name]
  } else {
    if (!req) req = REQPATH + (name === 'coffeescript' ? 'coffee' : name)
    try { mod = require(req) } catch (_) {/**/}
    _mods[name] = mod || null
  }
  return mod
}

/**
 * Fill the parsers object with loaders for each parser.
 *
 * @param   {Object} _p - The `parsers` object
 * @returns {Object}      The received object.
 * @private
 */
function _makelist (_p) {
  var names = {
    html: ['jade', 'pug'],
    css: ['sass', 'scss', 'less', 'stylus'],
    js: ['es6', 'babel', 'coffee', 'livescript', 'typescript']
  }

  // loads the module at first use and returns the parsed result
  function mkloader (dest, name) {
    return function _loadParser (p1, p2, p3, p4) {
      return (dest[name] = _req(name))(p1, p2, p3, p4)
    }
  }

  for (var type in names) {               // eslint-disable-line guard-for-in
    var dest = _p[type]

    names[type].forEach(function (name) { // eslint-disable-line no-loop-func
      dest[name] = mkloader(dest, name)
    })
  }
  return _p
}

// Exports the initialized parsers
module.exports = _makelist({
  _req: _req,
  html: {},
  css: {},
  js: { none: _none, javascript: _none }
})

module.exports.js.coffeescript = module.exports.js.coffee // 4 the nostalgics
