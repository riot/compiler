/*eslint-env mocha */
/*global compiler, expect */
/*eslint max-len: 0, no-console: 0 */

var fs = require('fs'),
  path = require('path'),
  norm = require('./helpers').normalizeJS

describe('Compile tags', function () {
  // in Win __dirname is a real path, in Lunux is symlink, path.relative uses symlink
  var
    basepath = path.resolve(__dirname, './'),
    fixtures = path.join(basepath, 'fixtures'),
    expected = path.join(basepath, 'expect')

  // adding some custom riot parsers
  // css
  compiler.parsers.css.myparser = function (tag, css) {
    return css.replace(/@tag/, tag)
  }
  // js
  compiler.parsers.js.myparser = function (js) {
    return js.replace(/@version/, '1.0.0')
  }

  function render (str, name, opts) {
    return compiler.compile(str, opts, name ? path.join(fixtures, name) : '')
  }

  function cat (dir, filename) {
    return fs.readFileSync(path.join(dir, filename), 'utf8')
  }

  function testFile (name, save) {
    var src = cat(fixtures, name + '.tag'),
      js = render(src, name + '.tag')

    if (save) {
      fs.writeFile(path.join(expected, name + '_out.js'), js, function (err) {
        if (err) throw err
      })
    }
    expect(norm(js)).to.equal(norm(cat(expected, name + '.js')))
  }

  function compileStr (src, name, opts) {
    return norm(render(src, name ? name + '.tag' : '', opts))
  }

  it('Timetable tag', function () {
    testFile('timetable')
  })

  it('Mixing JavaScript and custom tags', function () {
    testFile('mixed-js')
  })

  it('Tag definition and usage on same file', function () {
    testFile('same')
  })

  it('Scoped CSS', function () {
    testFile('scoped')
  })

  it('Quotes before ending HTML bracket', function () {
    testFile('input-last')
  })

  it('Preserves the object inside the tags', function () {
    testFile('box')
  })

  it('Make sure all the es6 import will be always moved in the global scope', function () {
    testFile('es6-import')
  })

  it('Flexible method style (v2.3)', function () {
    testFile('free-style')
  })

  it('Detect some fake closing html tags', function () {
    testFile('html-blocks')
  })

  it('The treeview question', function () {
    testFile('treeview')
  })

  it('<script src=file> tag includes an external file (v2.3.1)', function () {
    testFile('includes')
  })

  it('<script src=file defer> preserves the script tag (v2.3.22)', function () {
    testFile('includes-defer')
  })

  it('Dealing with unclosed es6 methods', function () {
    testFile('unclosed-es6')
  })

  it('Compatibility with one line tags', function () {
    testFile('oneline')
  })

  it('With attributes in the root', function () {
    testFile('root-attribs')
  })

  it('Parsing the options attribute in script tags', function () {
    var
      src = cat(fixtures, 'script-options.tag'),
      js = compiler.compile(src, { parser: testOpts })

    function testOpts (_, opts) {
      expect(opts).to.eql({ val: true })
    }
    expect(js).to.not.contain('options=')
  })

  it('parser can autoload from the `parsers` object', function () {
    var js
    try {
      js = require('coffee-script')
    } catch (_) {
      js = null
    }
    if (js) expect(compiler.parsers.js.coffee('x=0')).to.match(/var x/)
    else console.log('\tPlease give me a coffee.')
  })

  it('The `whitespace` option preserves newlines and tabs', function () {
    var src = [
        '<whitespace>',
        '\t<p>xyz',
        '\t  cc',
        '\t    ss</p>',
        '</whitespace>'
      ].join('\n'),
      str = compiler.compile(src, { whitespace: true })

    expect(str).to.be('riot.tag2(\'whitespace\', \'\t<p>xyz\\n' +
      '\t  cc\\n\t    ss</p>\\n\', \'\', \'\', function(opts) {\n});')
  })

  it('Whitespace within <pre> tags is always preserved', function () {
    testFile('pre')
  })

  it('Whitespace is compacted in other parts', function () {
    testFile('whitespace')
  })

  it('Empty tag', function () {
    testFile('empty')
  })

  it('The debug option prepends the filename relative to CWD to the source', function () {
    var js,
      ff = path.join(fixtures + '/box.tag'),
      rr = path.relative('.', path.join(fixtures, 'box.tag')),
      result = '//src: ' + rr.replace(/\\/g, '/')

    js = compiler.compile('<url/>', { debug: true }, ff)
    expect(js.slice(0, js.indexOf('\n'))).to.be(result)

    js = compiler.compile('<url/>', { debug: true }, rr)
    expect(js.slice(0, js.indexOf('\n'))).to.be(result)
  })

  it('The url name is optional', function () {
    var js = compiler.compile('<url/>')

    expect(js).to.equal("riot.tag2('url', '', '', '', function(opts) {\n});")
  })

  it('In shorthands newlines are converted to spaces #1306', function () {
    testFile('so-input')
  })

  it('Multiline tags must open/close with the same indentation, which is removed', function () {
    testFile('indentation')
  })

  it('The `entities` option give access to the compiled parts', function () {
    var parts = compiler.compile(cat(fixtures, 'treeview.tag'), { entities: true }),
      resarr = [
        ['treeview',
          /^<ul id="treeview"> <li> <treeitem data="\{treedata}">/,
          '', '',
          /\s+this.treedata = {/
        ],
        ['treeitem',
          /^<div class="\{bold: isFolder\(\)}" onclick="\{toggle}"/,
          '', '',
          /\s+var self = this\s+self.name = opts.data.name/
        ]
      ]

    expect(parts.length).to.be(2)
    for (var i = 0; i < 2; ++i) {
      var a = resarr[i]

      expect(parts[i]).to.be.an('object')
      expect(parts[i].tagName).to.be(a[0])
      expect(parts[i].html).to.match(a[1])
      expect(parts[i].css).to.be(a[2])
      expect(parts[i].attribs).to.be(a[3])
      expect(parts[i].js).to.match(a[4])
    }
  })

  it('The `exclude` option to ignore parts of the tag', function () {
    var parts = compiler.compile(cat(fixtures, 'treeview.tag'), {
        entities: true,
        exclude: ['html', 'js']
      }),
      dummyTag = [
        '<my-tag>',
        '<p>{ hi }</p>',
        '<style scoped>',
        ' :scope { color: red; }',
        '</style>',
        'this.hi = "hi"',
        '</my-tag>'
      ].join('\n')

    expect(compileStr(dummyTag, '', { exclude: ['html'] })).to.be(norm(
      "riot.tag2('my-tag', '', 'my-tag,[riot-tag=\"my-tag\"],[data-is=\"my-tag\"]{ color: red; }', '', function(opts) {\nthis.hi = \"hi\"\n});"))

    expect(compileStr(dummyTag, '', { exclude: ['html', 'js'] })).to.be(norm(
      "riot.tag2('my-tag', '', 'my-tag,[riot-tag=\"my-tag\"],[data-is=\"my-tag\"]{ color: red; }', '', function(opts) {\n});"))

    expect(compileStr(dummyTag, '', { exclude: ['css'] })).to.be(norm(
      "riot.tag2('my-tag', '<p>{hi}</p>', '', '', function(opts) {\nthis.hi = \"hi\"\n});"))

    expect(parts[0].html + parts[1].html).to.be('')
    expect(parts[0].js + parts[1].js).to.be('')

    parts = compiler.compile(cat(fixtures, 'scoped.tag'), {
      entities: true,
      exclude: ['css']
    })
    expect(parts[0].html).to.not.match(/\bstyle\b/)
    expect(parts[0].css).to.be('')

    parts = compiler.compile(cat(fixtures, 'root-attribs.tag'), {
      entities: true,
      exclude: ['attribs']
    })
    expect(parts[0].attribs).to.be('')

    // oneline has empty body in the 2nd tag
    parts = compiler.compile(cat(fixtures, 'oneline.tag'), { entities: true, exclude: ['html'] })
    expect(parts[0].html).to.be('')
    expect(parts[1].html).to.be('')
  })

  it('Output an expression without evaluation by escaping the opening brace', function () {
    testFile('print-brackets')
  })

  it('Script and Style blocks inside strings must be skipped riot#1448', function () {
    testFile('quoted-tags')
  })

  it('Html comments are removed anywhere, except inside JS strings', function () {
    testFile('html-comments')
  })

  it('html does not break on unbalanced quotes riot#1511', function () {
    testFile('one-quote')
  })

  it('svg in tag breaks in 2.3.21 #45', function () {
    testFile('svg')
  })

  it('Throws on unbalanced brackets in expression, well... not always', function () {
    expect(function () {
      compiler.compile('<mytag foo={[} bar={}/>')
    }).to.throwError()
    expect(function () {
      compiler.compile('<mytag foo={{} bar={}/>')
    }).not.to.throwError()
  })

  it('detection of untagged JS may fail in rare cases', function () {
    testFile('untagged-js')
  })
})

describe('The (internal) `brackets.array` function', function () {
  var arrayFn = require('./../../lib/brackets').array

  it('stores in cache the last custom brackets', function () {
    var bp = arrayFn('[ ]')

    // brackets must return the same array as bp
    expect(bp).to.be(arrayFn('[ ]'))
    // for defaults, brackets uses an static array, `bp` remains in cache
    compiler.compile('<mytag foo={0}/>', { brackets: null })
    // so again, we get the same custom array
    expect(bp).to.be(arrayFn('[ ]'))

    // this will change the array in cache
    arrayFn('{$ $}')
    // we get another, old instance
    expect(bp).not.to.be(arrayFn('[ ]'))
  })

  it('creation of regexes is not slow, Garbage Collection will be.', function () {
    var CNT = 25000,
      i, t1, t2, bp = [null, '~[ ]~']

    this.timeout(1000)  // eslint-disable-line

    // brackets must return the same array
    t1 = Date.now()
    for (i = 0; i < CNT; i++) arrayFn(bp[i % 1])
    t1 = Date.now() - t1

    // here, the array is re-created
    bp[0] = '# #'
    t2 = Date.now()
    for (i = 0; i < CNT; i++) arrayFn(bp[i % 1])
    t2 = Date.now() - t2

    console.log('\t%d calls using cache: %d ms, creating regexes: %d ms',
      CNT, t1, t2)
  })

  it('throws if receives invalid brackets characters', function () {
    // brackets must return the same array as bp
    expect(function () {
      arrayFn('<% %>')
    }).to.throwError()

    expect(function () {
      arrayFn('{}')
    }).to.throwError()
  })
})
