module.exports = {
  normalizeJS: function (js) {
    return js
      .replace(/ = function\s+\(/g, ' = function(')
      .replace(/ { ?|{ /g, '{')
      .replace(/\n\n+/g, '\n')
      .replace(/^\/\/src:.*\n/, '')
      .trim()
  },
  /**
   * Returns the module name for the given parser's name.
   *
   * @param   {string} name - one of the `html`, `css`, or `js` parsers.
   * @returns {string} The module name for using with `require()`
  */
  requireName: function (name) {
    switch (name) {
      case 'es6':
        return 'babel'
      case 'babel':
        return 'babel-core'
      case 'javascript':
        return 'none'
      case 'coffee':
      case 'coffeescript':
        return 'coffee-script'
      case 'scss':
      case 'sass':
        return 'node-sass'
      case 'typescript':
        return 'typescript-simple'
      default:
        return name
    }
  }
}
