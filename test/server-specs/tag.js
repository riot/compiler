var fs = require('fs'),
    path = require('path')

describe('Compile tags', function() {

  //var basedir = path.join(__dirname, 'fixtures')

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
    return compiler.compile(str, /*{ basedir: basedir }*/{}, name)
  }

  function cat(dir, filename) {
    return fs.readFileSync(path.join(__dirname, dir, filename)).toString()
  }

  function testFile(name) {
    var src = cat('fixtures', name + '.tag'),
        js = render(src, name + '.tag')

    //#if DEBUG
    //if (console && console.info) console.info('//' + name + '\n`' + js + '`\n')
    //#endif
    expect(js).to.equal(cat('expect', name + '.js'))
  }

  it('Timetable tag', function() {
    testFile('timetable')
  })

  it('Mixed JS and Tags', function() {
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

  it('More freedom in the format (v2.3)', function() {
    testFile('free-style')
  })

  it('detect some fake closing html tags', function () {
    testFile('html-block')
  })

  /*
  it('Include files (v2.3)', function() {
    testFile('includes')
  })
  */

  it('with attributes in the root', function () {
    var src = cat('fixtures', 'root-attribs.tag'),
        js = compiler.compile(src)        // no name, no options
    expect(js).to.equal(cat('expect', 'root-attribs.js'))
  })

  it('do not change internet urls', function () {
    var js = compiler.compile('<url/>', {}, 'http://github.com'),
        str = [
          '//src: http://github.com',
          "riot.tag2('url', '', '', '', function(opts) {",
          '});'
        ].join('\n')

    expect(js).to.equal(str)
  })

})