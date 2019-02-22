/*
  Utility functions
*/
var hasOwnProp = Object.prototype.hasOwnProperty

/**
 * Returns an new object with all of the properties from each received object.
 * When there are identical properties, the right-most property takes precedence.
 *
 * @returns {object} A new object containing all the properties.
 */
function _mixobj () {
  var target = {}

  for (var i = 0; i < arguments.length; i++) {
    var source = arguments[i]

    if (source) {
      for (var key in source) {
        // istanbul ignore else
        if (hasOwnProp.call(source, key)) {
          if (target[key] instanceof Array && source[key] instanceof Array) {
            target[key] = target[key].concat(source[key].filter(item => target[key].indexOf(item) < 0))
          } else if (typeof target[key] === 'object' && typeof source[key] === 'object') {
            target[key] = Object.assign({}, target[key], source[key])
          } else {
            target[key] = source[key]
          }
        }
      }
    }
  }
  return target
}

/**
 * Loads and returns a module instance without generating error.
 *
 * @param {string} name - The name of the module to require
 * @returns {Function}    Module instance, or null if error.
 */
function _tryreq (name) {
  var mod = null

  try { mod = require(name) } catch (e) {/**/}

  return mod
}

module.exports = {
  mixobj: _mixobj,
  tryreq: _tryreq
}
