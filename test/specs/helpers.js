module.exports = {
  normalizeJS: function (js) {
    return js
      .replace(/ = function\s+\(/g, ' = function(')
      .replace(/\n\n+/g, '\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
  }
}
