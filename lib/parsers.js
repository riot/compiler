/**
 * The compiler.parsers object holds the compiler's predefined parsers
 * @module
 */
'use strict'

var REQPATH = './parsers/'
var TRUE    = true
var NULL    = null

// Passtrough for the internal `none` and `javascript` parsers
function _none (src) {
  return src
}

// This is the main parsers object holding the html, js, and css keys
// initialized with the parsers that cannot be required.
//
var _parsers = {
  html: {},
  css: {},
  js: { none: _none, javascript: _none }
}

// Native riot parsers go here, having false if already required.
var _loaders = {
  html: { jade: TRUE, pug: TRUE },
  css: { sass: TRUE, scss: TRUE, less: TRUE, stylus: TRUE },
  js: { es6: TRUE, buble: TRUE, coffee: TRUE, livescript: TRUE, typescript: TRUE }
}

_loaders.js.coffeescript = TRUE // 4 the nostalgics

/**
 * Loads a "native" riot parser.
 *
 * It set the flag in the _loaders object to false for the required parser.
 * Try to load the parser and save the module to the _parsers object.
 * On error, throws a custom exception (adds 'riot' notice to the original).
 * On success returns the loaded module.
 *
 * @param   {string} branch - The branch name inside _parsers/loaders
 * @param   {string} parser - The parser's name
 * @returns {Function}      Loaded module.
 */
function _load (branch, parser) {
  var req = REQPATH + (parser === 'coffeescript' ? 'coffee' : parser)
  var mod

  _loaders[branch][parser] = false  // try once
  _parsers[branch][parser] = null
  try {
    mod = _parsers[branch][parser] = require(req)
  } catch (e) {
    // istanbul ignore next
    var err = 'Can\'t load the ' + branch + '.' + parser +
              ' riot parser: ' + ('' + e).replace(/^Error:\s/, '')
    // istanbul ignore next
    throw new Error(err)
  }
  return mod
}

/**
 * Returns the branch where the parser resides, or NULL if the parser not found.
 * If the parameter 'branch' is empty, the precedence order is js, css, html.
 *
 * @param   {string} branch - The name of the branch to search, can be empty
 * @param   {string} name   - The parser's name
 * @returns {string} Name of the parser branch.
 */
function _find (branch, name) {
  return branch ? _parsers[branch][name] && branch
    : _parsers.js[name]   ? 'js'
    : _parsers.css[name]  ? 'css'
    : _parsers.html[name] ? 'html' : NULL
}

/**
 * Returns a parser instance by its name, requiring the module without generating error.
 * Parsers name can include the branch (ej. 'js.es6').
 * If branch is not included, the precedence order for searching is 'js', 'css', 'html'
 *
 * Public through the `parsers._req` function.
 *
 * @param   {string}   name  - The parser's name, as registered in the parsers object
 * @param   {boolean}  [req] - true if required (throws on error)
 * @returns {Function} The parser instance, null if the parser is not found.
 */
function _req (name, req) {
  var
    err,
    mod,
    branch,
    parser = name.split('.')

  if (parser.length > 1) {
    branch = parser[0]
    parser = parser[1]
  } else {
    branch = NULL
    parser = name
  }

  // is the parser registered?
  branch = _find(branch, parser)
  if (!branch) {
    if (req) {
      err = 'Riot parser "' + name + '" is not registered.'
      throw new Error(err)
    }
    return NULL
  }

  // parser registered, needs load?
  if (_loaders[branch][parser]) {
    if (req) {
      mod = _load(branch, parser)
    } else {
      try {
        mod = _load(branch, parser)
      } catch (_) {
        // istanbul ignore next
        mod = NULL
      }
    }
  } else {
    mod = _parsers[branch][parser]
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
function _setLoaders (_p) {

  // loads the module at first use and returns the parsed result
  function mkloader (branch, parser) {
    return function _loadParser (p1, p2, p3, p4) {
      var fn = _load(branch, parser)
      return fn(p1, p2, p3, p4)
    }
  }

  for (var branch in _loaders) {
    // istanbul ignore else
    if (_loaders.hasOwnProperty(branch)) {
      var names = Object.keys(_loaders[branch])

      names.forEach(function (name) {
        _p[branch][name] = mkloader(branch, name)
      })
    }
  }
  return _p
}

_setLoaders(_parsers)._req = _req

module.exports = _parsers
