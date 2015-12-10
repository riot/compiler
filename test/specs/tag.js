var fs = require('fs'),
  path = require('path')

describe('Compile tags', function() {
  // in Windows __dirname is the real path, path.relative uses symlink
  var
    basepath = path.resolve(__dirname, '../..'),
    fixtures = path.relative(basepath, path.join(__dirname, 'fixtures')),
    expected = path.relative(basepath, path.join(__dirname, 'expect'))

  // adding some custom riot parsers
  // css
  compiler.parsers.css.myparser = function(tag, css) {
    return css.replace(/@tag/, tag)
  }
  // js
  compiler.parsers.js.myparser = function(js) {
    return js.replace(/@version/, '1.0.0')
  }

  function render(str, name) {
    return compiler.compile(str, { debug: true }, path.join(fixtures, name))
  }

  function cat(dir, filename) {
    return fs.readFileSync(path.join(dir, filename)).toString()
  }

  function testFile(name, save) {
    var src = cat(fixtures, name + '.tag'),
      js = render(src, name + '.tag')

    if (save)
      fs.writeFile(path.join(expected, name + '_out.js'), js, function (err) {
        if (err) throw err
      })
    expect(js).to.equal(cat(expected, name + '.js'))
  }

  it('Timetable tag', function() {
    testFile('timetable')
  })

  it('Mixing JavaScript and custom tags', function() {
    testFile('mixed-js')
  })

  it('Tag definition and usage on same file', function() {
    testFile('same')
  })

  it('Scoped CSS', function() {
    testFile('scoped')
  })

  it('Quotes before ending HTML bracket', function() {
    testFile('input-last')
  })

  it('Preserves the object inside the tags', function() {
    testFile('box')
  })

  it('Flexible method style (v2.3)', function() {
    testFile('free-style')
  })

  it('Detect some fake closing html tags', function () {
    testFile('html-blocks')
  })

  it('The treeview question', function () {
    testFile('treeview')
  })

  it('Included files (v2.3.1)', function() {
    testFile('includes')
  })

  it('Dealing with unclosed es6 methods', function () {
    testFile('unclosed-es6')
  })

  it('Compatibility with one line tags', function () {
    testFile('oneline')
  })

  it('With attributes in the root', function () {
    var
      src = cat(fixtures, 'root-attribs.tag'),
      js = compiler.compile(src)        // no name, no options
    expect(js).to.equal(cat(expected, 'root-attribs.js'))
  })

  it('Parsing the options attribute in script tags', function () {
    var
      src = cat(fixtures, 'script-options.tag'),
      js = compiler.compile(src, { parser: testOpts })

    function testOpts(src, opts) {
      expect(opts).to.eql({ val: true })
    }
  })

  it('The `whitespace` option preserves newlines and tabs', function () {
    var src = [
        '<whitespace>',
        '\t<p>xyz',
        '\t  cc',
        '\t    ss</p>',
        '</whitespace>'
      ].join('\n'),
      str = compiler.compile(src, {whitespace: true})

    expect(str).to.be('riot.tag2(\'whitespace\', \'\t<p>xyz\\n\t  cc\\n\t    ss</p>\\n\', \'\', \'\', function(opts) {\n});')
  })

  it('Whitespace within <pre> tags is always preserved', function () {
    testFile('pre')
  })

  it('Whitespace is compacted in other parts', function() {
    testFile('whitespace')
  })

  it('Empty tag', function () {
    testFile('empty')
  })

  it('The url name is optional', function () {
    var js = compiler.compile('<url/>', {})
    expect(js).to.equal("riot.tag2('url', '', '', '', function(opts) {\n});")
  })

  it('In shorthands newlines are converted to spaces #1306', function () {
    testFile('so-input')
  })

  it('Multiline tags must be open/closed with the same indentation, which is removed', function () {
    testFile('indentation')
  })

  it('The `entities` option give access to the compiled parts', function () {
    var parts = compiler.compile(cat(fixtures, 'treeview.tag'), {entities: true}),
      resarr = [
        [ 'treeview',
          /^<ul id="treeview"> <li> <treeitem data="\{treedata}">/,
          '', '',
          /\s+this.treedata = {/
        ],
        [ 'treeitem',
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
        'this.hi = "hi"',
        '<style scoped>',
        ' :scope { color: red; }',
        '</style>',
        '</my-tag>'
      ].join('\n')

    expect(compiler.compile(dummyTag, {
      exclude: ['html']
    })).to.be("riot.tag2('my-tag', '', 'my-tag,[riot-tag=\"my-tag\"] { color: red; }', '', function(opts) {\nthis.hi = \"hi\"\n\n});")

    expect(compiler.compile(dummyTag, {
      exclude: ['html', 'js']
    })).to.be("riot.tag2('my-tag', '', 'my-tag,[riot-tag=\"my-tag\"] { color: red; }', '', function(opts) {\n});")

    expect(compiler.compile(dummyTag, {
      exclude: ['css']
    })).to.be("riot.tag2('my-tag', '<p>{hi}</p>', '', '', function(opts) {\nthis.hi = \"hi\"\n\n}, '{ }');")

    expect(parts[0].html + parts[1].html).to.be('')
    expect(parts[0].js + parts[1].js).to.be('')

    parts = compiler.compile(cat(fixtures, 'scoped.tag'), {
      entities: true,
      exclude: ['css']
    })
    expect(parts[0].html).to.not.match(/style/)
    expect(parts[0].css).to.be('')

    parts = compiler.compile(cat(fixtures, 'root-attribs.tag'), {
      entities: true,
      exclude: ['attribs']
    })
    expect(parts[0].attribs).to.be('')
  })

  it('Output an expression without evaluation by escaping the opening brace', function () {
    testFile('print-brackets')
  })

  it('Escaping raw html in expressions through the `=` flag', function () {
    testFile('raw-html')
  })

})
