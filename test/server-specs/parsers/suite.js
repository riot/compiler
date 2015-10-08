describe('All the tags get compiler as expected', function() {


  it('test html', function() {

    function test(str, resStr) {
      expect(compiler.html(str, {})).to.be(resStr)
    }

    function testParser(str, resStr) {
      expect(compiler.html(str, { parser: parser, expr: true })).to.be(resStr)
    }

    // custom javscript parser
    function parser(str) {
      return '@' + str
    }

    test('<p/>', '<p></p>')
    test('<a a={ a }>', '<a a="{#a#}">')
    test("<a a='{ a }'>", '<a a="{#a#}">')
    test('<a a={ a } b={ b }>', '<a a="{#a#}" b="{#b#}">')
    test('<a href="a?b={ c }">', '<a href="a?b={#c#}">')
    test('<a id="{ a }b">', '<a id="{#a#}b">')
    test('<input id={ a }/>', '<input id="{#a#}">')
    test('<a id={ a }/>', '<a id="{#a#}"></a>')
    test('<a><b/></a>', '<a><b></b></a>')

    test('{ a }<!-- c -->', '{#a#}')
    test('<!-- c -->{ a }', '{#a#}')
    test('<!-- c -->{ a }<!-- c --><p/><!-- c -->', '{#a#}<p></p>')
    test('<a loop={ a } disabled="{ b }" visible>', '<a __loop="{#a#}" __disabled="{#b#}" visible>')

    test('{ "a" }', '{#&quot;a&quot;#}')
    test('\\{ a \\}', '{ a }')

    testParser('<a href={ a }>', '<a href="{#@ a#}">')
    testParser('<a>{ b }</a>', '<a>{#@ b#}</a>')

  })

  describe('test custom parsers', function() {

    this.timeout(10000)

    function test(name, opts) {

      var type = opts.type,
        dir = 'test/server-specs/parsers',
        basename = name + (type ? '.' + type : ''),
        src = cat(dir + '/' + basename + '.tag'),
        should = cat(dir + '/js/' + basename + '.js')

      expect(compiler.compile(src, opts).trim()).to.be(should)

    }

    // complex.tag
    it('complex tag structure', function() {
      test('complex', {})
    })
    // test.tag
    /*it('javascript (root container)', function() {
      test('test', { expr: true })
    })*/
    // test-alt.tag
    it('javascript (comment hack)', function() {
      test('test-alt', { expr: true })
    })
    // test.coffee.tag
    it('coffeescript', function() {
      test('test', { type: 'coffee', expr: true })
    })
    // test.es6.tag
    it('es6 (babeljs)', function() {
      test('test', { type: 'es6' })
    })
    // test-attr.es6.tag
    it('es6 with shorthands (fix #1090)', function() {
      test('test-attr', { type: 'es6', expr: true })
    })
    // test.livescript.tag
    it('livescript', function() {
      test('test', { type: 'livescript' })
    })
    // test.jade.tag & slide.jade.tag
    it('jade', function() {
      test('test.jade', { template: 'jade' })
      test('slide.jade', { template: 'jade' })
    })
    // style.tag
    it('default style', function() {
      test('style', {})
    })
    // stylus.tag
    it('stylus', function() {
      test('stylus', {})
    })
    // style.escoped.tag
    it('scoped styles', function() {
      test('style.scoped', {})
    })
    // brackets.tag
    it('different brackets', function() {
      test('brackets', { brackets: '${ }' })
    })

  })
})
