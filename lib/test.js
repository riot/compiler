/* eslint no-console: 0 */
var fs = require('fs')
var path = require('path')

var f = path.resolve(__dirname, './parsers/babel.js')

function fileExists (file) {
  var exists = true

  try {
    fs.accessSync(file, fs.R_OK)
  } catch (_) {
    exists = false
  }
  return exists
}

console.log('\n%s', f)
console.log(fs.existsSync(f))
console.log(fileExists(f))
