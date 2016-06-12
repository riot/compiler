//
// Parsers Suite
//
/* eslint-env mocha */
/* global compiler, expect */
/* eslint no-console: 0, max-len: 0 */

var
  path = require('path'),
  fs   = require('fs'),
  norm = require('../helpers').normalizeJS

var
  fixtures = __dirname,
  expected = path.join(fixtures, 'js'),
  parsers  = compiler.parsers

function have (name) {
  if (parsers._req(name)) return true

  if (name !== 'unknown') {
    console.error('\t' + name + ' parser not installed locally.')
  }
  return false
}

function cat (dir, filename) {
  return fs.readFileSync(path.join(dir, filename), 'utf8')
}

function testParser (name, opts, save) {
  opts = opts || {}
  var
    file = name + (opts.type ? '.' + opts.type : ''),
    str1 = cat(fixtures, file + '.tag'),
    str2 = cat(expected, file + '.js'),
    js = compiler.compile(str1, opts, path.join(fixtures, file + '.tag'))

  if (save) {
    fs.writeFile(path.join(expected, file + '_out.js'), js, function (err) {
      if (err) throw err
    })
  }
  expect(norm(js)).to.be(norm(str2))
}

describe('HTML parsers', function () {

  this.timeout(12000)   // eslint-disable-line

  function testStr (str, resStr, opts) {
    expect(compiler.html(str, opts || {})).to.be(resStr)
  }

  // test.jade.tag & slide.jade.tag
  it('jade', function () {
    if (have('jade') && have('coffee')) {
      testParser('test.jade', { template: 'jade' })
      testParser('slide.jade', { template: 'jade' })
    }
  })
  it('pug', function () {
    if (have('pug') && have('coffee')) {
      testParser('test.pug', { template: 'pug' })
      testParser('slide.pug', { template: 'pug' })
    }
  })

  describe('Custom parser in expressions', function () {
    var opts = {
      parser: function (str) { return '@' + str },
      expr: true
    }

    it('don\'t touch format before run parser, compact & trim after (2.3.0)', function () {
      testStr('<a href={\na\r\n}>', '<a href="{@ a}">', opts)
      testStr('<a>{\tb\n }</a>', '<a>{@\tb}</a>', opts)
    })

    it('plays with the custom parser', function () {
      testStr('<a href={a}>', '<a href="{@a}">', opts)
      testStr('<a>{ b }</a>', '<a>{@ b}</a>', opts)
    })

    it('plays with quoted values', function () {
      testStr('<a href={ "a" }>', '<a href="{@ \u2057a\u2057}">', opts)
      testStr('<a>{"b"}</a>', '<a>{@\u2057b\u2057}</a>', opts)
    })

    it('remove the last semi-colon', function () {
      testStr('<a href={ a; }>', '<a href="{@ a}">', opts)
      testStr('<a>{ b ;}</a>', '<a>{@ b}</a>', opts)
    })

    it('prefixing the expression with "^" prevents the parser (2.3.0)', function () {
      testStr('<a href={^ a }>', '<a href="{a}">', opts)
      testStr('<a>{^ b }</a>', '<a>{b}</a>', opts)
    })

  })

})

describe('JavaScript parsers', function () {

  function _custom () {
    return 'var foo'
  }

  this.timeout(45000)     // eslint-disable-line

  // complex.tag
  it('complex tag structure', function () {
    if (have('none')) {   // testing none, for coverage too
      testParser('complex')
    } else {
      expect().fail('parsers.js must have a "none" property')
    }
  })

  // test.tag
  it('javascript (root container)', function () {
    testParser('test', { expr: true })
  })

  // test-alt.tag
  it('javascript (comment hack)', function () {
    testParser('test-alt', { expr: true })
  })

  it('mixed riotjs and javascript types', function () {
    if (have('javascript')) {   // for js, for coverage too
      testParser('mixed-js')
    } else {
      expect().fail('parsers.js must have a "javascript" property')
    }
  })

  // test.coffee.tag
  it('coffeescript', function () {
    if (have('coffee')) {
      testParser('test', { type: 'coffee', expr: true })
    }
  })

  // test.livescript.tag
  it('livescript', function () {
    if (have('livescript')) {
      testParser('test', { type: 'livescript' })
    }
  })

  // test.livescript.tag
  it('typescript', function () {
    if (have('typescript')) {
      testParser('test', { type: 'typescript' })
    }
  })

  // test.es6.tag
  it('es6', function () {
    if (have('es6')) {
      testParser('test', { type: 'es6' })
    }
  })

  // test.babel.tag
  it('babel', function () {
    if (have('babel')) {
      testParser('test', { type: 'babel' })
    }
  })

  // test-attr.babel.tag (also test alias coffeescript)
  it('coffee with shorthands (fix #1090)', function () {
    if (have('coffeescript')) {
      testParser('test-attr', { type: 'coffeescript', expr: true })
    }
  })

  // test.custom.tag
  it('custom js parser', function () {
    parsers.js.custom = _custom
    testParser('test', { type: 'custom' })
  })

  // complet test for none
  it('the javascript parser is an alias of "none" and does nothing', function () {
    var code = 'fn () {\n}\n'

    expect(parsers.js.javascript(code)).to.be(code)
  })

})

describe('Style parsers', function () {

  this.timeout(12000)   // eslint-disable-line

  // custom parser
  parsers.css.postcss = function (tag, css) {
    return require('postcss')([require('autoprefixer')]).process(css).css
  }

  // style.tag
  it('default style', function () {
    testParser('style')
  })

  // style.escoped.tag
  it('scoped styles', function () {
    testParser('style.scoped')
  })

  // stylus.tag
  it('stylus', function () {
    if (have('stylus')) {
      testParser('stylus')
      testParser('stylus-import')
    }
  })

  // sass.tag
  it('sass, indented 2, margin 0', function () {
    if (have('sass')) {
      testParser('sass')
    }
  })

  // scss.tag
  it('scss (no indentedSyntax)', function () {
    if (have('scss')) {
      testParser('scss')
      testParser('scss-import')
    }
  })

  // testing the options attribute on the style tag
  it('custom style options', function () {
    if (have('sass')) {
      testParser('sass.options')
    }
  })

  // scss.tag
  it('custom parser using postcss + autoprefixer', function () {
    if (have('postcss')) {
      testParser('postcss')
    }
  })

  // less.tag
  it('less', function () {
    if (have('less')) {
      testParser('less')
      testParser('less-import')
    }
  })

  it('mixing CSS blocks with different type', function () {
    testParser('mixed-css')
  })

  it('the style option for setting the CSS parser (v2.3.13)', function () {
    var
      source = [
        '<style-option>',
        '  <style>',
        '    p {top:0}',
        '  </style>',
        '</style-option>'
      ].join('\n'),
      result

    parsers.css.myParser2 = function (t, s) { return s.replace(/\bp\b/g, 'P') }
    result = compiler.compile(source, { style: 'myParser2' })
    expect(result).to.contain('P {top:0}')
  })

  it('the style parser options can be passed directly to the compiler', function () {
    var
      source = [
        '<style-option>',
        '  <style>',
        '    p {top:0}',
        '  </style>',
        '</style-option>'
      ].join('\n')

    parsers.css.myParser2 = function (tag, css, opts) {
      expect(opts.flag).to.be(true)
      // don't do anything
      return css
    }

    compiler.compile(source, {
      style: 'myParser2',
      parserOptions: {
        style: {
          flag: true
        }
      }
    })
  })

})

describe('Other', function () {

  it('unknown HTML template parser throws an error', function () {
    var
      str1 = cat(fixtures, 'test.tag')

    expect(compiler.compile).withArgs(str1, { template: 'unknown' }).to.throwError()
  })

  it('unknown JS & CSS parsers throws an error', function () {
    var
      str1 = cat(fixtures, 'test.tag'),
      str2 = [
        '<error>',
        "<style type='unknown'>p{top:0}</style>",
        '</error>'
      ].join('\n')

    expect(compiler.compile).withArgs(str1, { type: 'unknown' }).to.throwError()
    expect(compiler.compile).withArgs(str2).to.throwError()
    expect(have('unknown')).to.be(false)
  })

  it('the js parser options can be passed directly to the compiler', function () {
    var
      tag = [
        '<custom-options>',
        'this.foo = () => null',
        '<custom-options>'
      ].join('\n')

    parsers.js.foo = function (js, opts) {
      expect(opts.flag).to.be(true)
      // don't do anything
      return js
    }

    compiler.compile(tag, {
      js: 'foo',
      parserOptions: {
        js: {
          flag: true
        }
      }
    })

  })

  it('the template parser options can be passed directly to the compiler', function () {
    var
      tag = [
        '<custom-options>',
        'this.foo = () => null',
        '<custom-options>'
      ].join('\n')

    parsers.html.foo = function (html, opts) {
      expect(opts.flag).to.be(true)
      // don't do anything
      return ''
    }

    expect(compiler.compile(tag, {
      template: 'foo',
      parserOptions: {
        template: {
          flag: true
        }
      }
    })).to.be('')

  })

  // brackets.tag
  it('using different brackets', function () {
    testParser('brackets', { brackets: '${ }' })
  })

  /*
  it('emiting raw html through the `=` flag, with parser', function () {
    // custom parser
    parsers.js.rawhtml = function (js) {
      return js.replace(/"/g, '&quot;')
    }
    testParser('raw', { type: 'rawhtml', expr: true })
  })*/

})
