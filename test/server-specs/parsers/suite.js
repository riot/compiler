//
// Parsers Suite
//
/*eslint-env node, mocha */
var
  path = require('path'),
  fs = require('fs')
var
  basedir = __dirname,
  jsdir = path.join(basedir, 'js'),
  have = compiler.parsers._get

function cat(dir, filename) {
  return fs.readFileSync(path.join(dir, filename), 'utf8')
}

function normalize(str) {
  var
    n = str.search(/[^\n]/)
  if (n < 0) return ''
  if (n > 0) str = str.slice(n)
  n = str.search(/\n+$/)
  return ~n ? str.slice(0, n) : str
}

function testParser(name, opts) {
  var
    file = name + (opts.type ? '.' + opts.type : ''),
    str1 = cat(basedir, file + '.tag'),
    str2 = cat(jsdir, file + '.js')

  expect(normalize(compiler.compile(str1, opts || {}))).to.be(normalize(str2))
}

describe('HTML parsers', function () {

  function testStr(str, resStr, opts) {
    expect(compiler.html(str, opts || {})).to.be(resStr)
  }

  if (have('jade')) {
    // test.jade.tag & slide.jade.tag
    it('jade', function () {
      testParser('test.jade', { template: 'jade' })
      testParser('slide.jade', { template: 'jade' })
    })
  }

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
      testStr('<a href={ "a" }>', '<a href="{@ &quot;a&quot;}">', opts)
      testStr('<a>{"b"}</a>', '<a>{@&quot;b&quot;}</a>', opts)
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

  this.timeout(12000)

  // complex.tag
  it('complex tag structure', function () {
    testParser('complex', {})
  })

  // testParser.tag
  it('javascript (root container)', function () {
    testParser('test', { expr: true })
  })

  // testParser-alt.tag
  it('javascript (comment hack)', function () {
    testParser('test-alt', { expr: true })
  })

  it('mixed javascript & coffee-script', function () {
    testParser('test', { type: 'javascript' })
  })

  if (have('coffee')) {
    // testParser.coffee.tag
    it('coffeescript', function () {
      testParser('test', { type: 'coffee', expr: true })
    })
  }

  if (have('livescript')) {
    // testParser.livescript.tag
    it('livescript', function () {
      testParser('test', { type: 'livescript' })
    })
  }

  if (have('typescript')) {
    // testParser.livescript.tag
    it('typescript', function () {
      testParser('test', { type: 'typescript' })
    })
  }

  if (have('es6')) {
    // testParser.es6.tag
    it('es6 (babel-core or babel)', function () {
      testParser('test', { type: 'es6' })
    })
    // testParser-attr.es6.tag
    it('es6 with shorthands (fix #1090)', function () {
      testParser('test-attr', { type: 'es6', expr: true })
    })
  }

})


describe('Style parsers', function () {

  // style.tag
  it('default style', function () {
    testParser('style', {})
  })

  // style.escoped.tag
  it('scoped styles', function () {
    testParser('style.scoped', {})
  })

  if (have('stylus')) {
    // stylus.tag
    it('stylus', function () {
      testParser('stylus', {})
    })
  }

  // brackets.tag
  it('different brackets', function () {
    testParser('brackets', { brackets: '${ }' })
  })

})

describe('Other', function () {

  it('Unknown HTML template throws error', function () {
    var
      str1 = cat(basedir, 'test.tag')

    expect(compiler.compile).withArgs(str1, {template: 'unknown'}).to.throwError()
  })

  it('Unknown JS & CSS parsers throws error', function () {
    var
      str1 = cat(basedir, 'test.tag'),
      str2 = [
        '<error>',
        "<style type='unknown'>p{top:0}</style>",
        '</error>'
      ].join('\n')

    expect(compiler.compile).withArgs(str1, {type: 'unknown'}).to.throwError()
    expect(compiler.compile).withArgs(str2).to.throwError()
  })

})
