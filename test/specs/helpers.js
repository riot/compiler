module.exports = {
  normalizeJS: function (js) {
    return js
      .replace(/ = function\s+\(/g, ' = function(')
      .replace(/ { ?|{ /g, '{')
      .replace(/\n\n+/g, '\n')
      .replace(/^\/\/src:.*\n/, '')
      .trim()
  }
}
