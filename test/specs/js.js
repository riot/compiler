/* eslint-env mocha */
/* global compiler, expect */

var fs = require('fs'),
  path = require('path'),
  norm = require('./helpers').normalizeJS

describe('Compile JS', function () {

  it('missing JS parser throws an exception', function () {
    expect(function () {
      compiler.js('x=1', 'unknown')
    }).to.throwError()
  })

  it('new compiler.js API allows omit parameters (v2.3.20)', function () {
    var
      src = 'fn(){\n}\n',
      js = 'this.fn = function(){\n}.bind(this)\n'

    // parameters are (js, opts-object, type-string, extra-object)
    expect(compiler.js(src, null, '', null)).to.be(js)
    expect(compiler.js(src, null, '')).to.be(js)
    expect(compiler.js(src, '', null)).to.be(js)
    expect(compiler.js(src, '')).to.be(js)
    expect(compiler.js(src)).to.be(js)

    expect(compiler.js(src, null, 'none', null)).to.be(src)
    expect(compiler.js(src, null, 'none')).to.be(src)
    expect(compiler.js(src, 'none', null)).to.be(src)
    expect(compiler.js(src, 'none')).to.be(src)

    expect(compiler.js(src, 'none', {})).to.be(src)
    expect(compiler.js(src, { type: 'none' })).to.be(src)
    expect(compiler.js(src, { type: 'none' }, {})).to.be(src)

    expect(compiler.js(src, null, {})).to.be(js)
    expect(compiler.js(src, {}, null)).to.be(js)
    expect(compiler.js(src, {}, { type: 'none' })).to.be(js)
    expect(compiler.js(src, '', { type: 'none' })).to.be(js)
    expect(compiler.js(src, null, { type: 'none' })).to.be(js)
  })

})

describe('riotjs', function () {

  function render (str) {
    return compiler.js(str, {})
  }

  function cat (dir, filename) {
    return fs.readFileSync(path.join(__dirname, dir, filename), 'utf8')
  }

  function testFile (file/*, opts*/) {
    expect(norm(render(cat('fixtures', file)))).to.be(norm(cat('expect', file)))
  }

  it('converts Class method into v5 style', function () {
    testFile('riotjs.method.js')
  })

  it('converts Class methods into v5 style (alternate formats)', function () {
    testFile('riotjs.methods-alt.js')
  })

  it('skips comments', function () {
    testFile('riotjs.comment.js')
  })

  it('converts single line method into v5 style', function () {
    testFile('riotjs.single-line-method.js')
  })

  it('preserves the default object structure', function () {
    testFile('riotjs.object.js')
  })

  it('keeps try/catch as is #768', function () {
    testFile('riotjs.try-catch.js')
  })

  it('preserves non es6 methods #1043', function () {
    testFile('riotjs.getter-setter.js')
  })

})
