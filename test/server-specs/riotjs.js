var fs = require('fs'),
    path = require('path')

describe('riotjs', function() {

  function normalize(js) {
    return js
      .replace(/[ \t]+$/gm, '')     // trim all trailing whitespace
      .replace(/\n{3,}/g, '\n\n')   // compact empty lines
  }

  function render(str) {
    return normalize(compiler.js(str, {}))
  }

  function cat(dir, filename) {
    return fs.readFileSync(path.join(__dirname, dir, filename)).toString()
  }

  function cat2(filename) {
    return normalize(cat('expect', filename))
  }

  it('converts Class method into v5 style', function() {
    var file = 'riotjs.method.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
  it('skips comments', function() {
    var file = 'riotjs.comment.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
  it('converts single line method into v5 style', function() {
    var file = 'riotjs.single-line-method.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
  it('preserves the default object structure', function() {
    var file = 'riotjs.object.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
  it('keeps try/catch as is #768', function() {
    var file = 'riotjs.try-catch.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
  it('preserves non es6 methods #1043', function() {
    var file = 'riotjs.getter-setter.js'
    expect(render(cat('fixtures', file))).to.equal(cat2(file))
  })
})
