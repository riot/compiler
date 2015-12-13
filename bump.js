/*
  Usage: node bump [directory [searchString]]

  Replace all ocurrecences of searchString with the version in package.json
  directory defaults to "dist/"
  searchString defaults to "WIP"
*/
var
  version = require('./package.json').version,
  path    = require('path'),
  fs      = require('fs')

var
  repStr = process.argv[3] || 'WIP',
  fpath  = process.argv[2] || 'dist/',
  count  = 0,
  re = RegExp('\\b' + repStr.replace(/(?=[[\]()*+?.^$|])/g, '\\') + '\\b', 'g')

version = 'v' + version
console.log('bump %s for %s', version, path.join(fpath, '*.js'))

fs.readdirSync(fpath).forEach(function (name) {
  if (path.extname(name) === '.js') {

    name = path.join(fpath, name)
    console.log(name)

    var src = fs.readFileSync(name, 'utf8')
    fs.writeFileSync(name, src.replace(re, version), 'utf8')
    count++
  }
})

if (!count) {
  console.error('Error: There\'s no .js files in %s', fpath)
}
