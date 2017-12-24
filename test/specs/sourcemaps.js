/*eslint-env mocha */
/*global compiler, expect */
/*eslint max-len: 0, no-console: 0 */

var fs = require('fs'),
  path = require('path')

describe('Sourcemaps generation', function () {
  // in Win __dirname is a real path, in Lunux is symlink, path.relative uses symlink
  var
    basepath = path.resolve(__dirname, './'),
    fixtures = path.join(basepath, 'fixtures')


  function render (str, name, opts) {
    return compiler.compile(str, opts, name ? path.join(fixtures, name) : '')
  }

  function cat (dir, filename) {
    return fs.readFileSync(path.join(dir, filename), 'utf8')
  }

  function compile (name, isInline) {
    var src = cat(fixtures, name + '.tag')
    return render(src, name + '.tag', { sourcemap: isInline ? 'inline' : true })
  }

  it('It generates source and sourcemaps', function () {
    var out = compile('timetable')

    expect(out.code).to.be.ok
    expect(out.sourcemap).to.be.ok
  })

  it('It generates inline sourcemaps', function () {
    var out = compile('timetable', true)

    expect(out).to.be.ok
    expect(out).to.match(/\/\/# sourceMappingURL=/)
  })
})
