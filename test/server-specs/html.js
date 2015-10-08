
function render(str, opts) {
  return compiler.html(str, opts || {})
}

describe('Compile HTML', function() {

  it('compiles void tag into separated: <x/> -> <x></x>', function() {
    expect(render('<p/>')).to.be('<p></p>')
    expect(render('<a><b/></a>')).to.be('<a><b></b></a>')
    expect(render('<my-tag value={ test }/>')).to.be('<my-tag value="{#test#}"></my-tag>')
  })

  it('adds the prefix `riot-` to some attributes', function() {
    expect(render('<img src={ a }>')).to.be('<img riot-src="{#a#}">')
  })

  it('adds the prefix `__` to boolean attributes', function() {
    expect(render('<a disabled={ a } nowrap="{ b }">')).to.be('<a __disabled="{#a#}" __nowrap="{#b#}">')
  })

  it('adds double quotes to the attribute value', function() {
    expect(render('<a a={ a }>')).to.be('<a a="{#a#}">')
    expect(render("<a a='{ a }'>")).to.be('<a a="{#a#}">')
    expect(render('<a a={ a } b={ b }>')).to.be('<a a="{#a#}" b="{#b#}">')
    expect(render('<a id={ a }/>')).to.be('<a id="{#a#}"></a>')
    expect(render('<input id={ a }/>')).to.be('<input id="{#a#}">')
  })

  it('keeps interpolations', function() {
    expect(render('<a href="a?b={ c }">')).to.be('<a href="a?b={#c#}">', /\.c\b/)
    expect(render('<a id="{ a }b">')).to.be('<a id="{#a#}b">', /\.a\b/)
  })

  it('skips HTML comments', function() {
    expect(render('{ a }<!-- c -->')).to.be('{#a#}')
    expect(render('<!-- c -->{ a }')).to.be('{#a#}')
    expect(render('<!-- c -->{ a }<!-- c --><p/><!-- c -->')).to.be('{#a#}<p></p>')
  })

  it('mormalizes line endings', function() {
    expect(render('<p>\r</p>\r\r\n<p>\n</p>', { whitespace: 1 })).to.be('<p>\\n</p>\\n\\n<p>\\n</p>')
  })

  describe('Custom parser in expressions', function() {

    // custom parser in expressions
    function parser(str) { return '@' + str }
    function testParser(str, resStr) {
      expect(compiler.html(str, { parser: parser, expr: true })).to.equal(resStr)
    }

    it('don\'t touch format before run parser, compact & trim after (2.3.0)', function() {
      testParser('<a href={\na\r\n}>', '<a href="{#@ a#}">')
      testParser('<a>{\tb\n }</a>', '<a>{#@\tb#}</a>')
    })

    it('plays with the custom parser', function() {
      testParser('<a href={a}>', '<a href="{#@a#}">')
      testParser('<a>{ b }</a>', '<a>{#@ b#}</a>')
    })

    it('plays with quoted values', function() {
      testParser('<a href={ "a" }>', '<a href="{#@ &quot;a&quot;#}">')
      testParser('<a>{"b"}</a>', '<a>{#@&quot;b&quot;#}</a>')
    })

    it('prefixing the expression with "^" prevents the parser (2.3.0)', function() {
      testParser('<a href={^ a }>', '<a href="{#a#}">')
      testParser('<a>{^ b }</a>', '<a>{#b#}</a>')
    })

    it('remove the last semi-colon', function() {
      testParser('<a href={ a; }>', '<a href="{#@ a#}">')
      testParser('<a>{ b ;}</a>', '<a>{#@ b#}</a>')
    })

  })

  describe('2.3.0', function () {

    // fix #827
    it('fix to input type=number', function () {
      expect(render('<input type=number>')).to.be('<input type="{#@001#}">')
    })

    it('normalizes attributes, all values in double quotes', function () {
      expect(render('<a a={a} b=number c =\'x\'>')).to.be('<a a="{#a#}" b="number" c="x">')
    })

    it('lf/cr in attribute values are compacted to space', function () {
      expect(render("<p\r\n a\t= ' {a}' b='{b}\n'\n\n>")).to.be('<p a=" {#a#}" b="{#b#} ">')
      expect(render("<p\ta ='p:{}\r\n;'>")).to.be('<p a="p:{##} ;">')
    })

    it('double quotes in expressions are converted to `&quot;`', function () {
      expect(render('<p x={ "a" } y="{2}">')).to.be('<p x="{#&quot;a&quot;#}" y="{#2#}">')
      expect(render('<p x="{"a"}" y="{2}">')).to.be('<p x="{#&quot;a&quot;#}" y="{#2#}">')
      expect(render('<p x=\'{"a"}\' y="{2}">')).to.be('<p x="{#&quot;a&quot;#}" y="{#2#}">')
      expect(render('<p x="{""}">')).to.be('<p x="{#&quot;&quot;#}">')
    })

    it('single quotes in expressions are escaped', function () {
      expect(render("<p x={ 'a' } y='{2}'>")).to.be('<p x="{#\'a\'#}" y="{#2#}">')
      expect(render("<p x='{'a'}' y='{2}'>")).to.be('<p x="{#\'a\'#}" y="{#2#}">')
      expect(render("<p x=\"{'a'}\" y='{2}'>")).to.be('<p x="{#\'a\'#}" y="{#2#}">')
      expect(render("<p x='{''}'>")).to.be('<p x="{#\'\'#}">')
    })

    it('preserve `<` and `>` operators in expressions', function () {
      expect(render('<p x={ a>b }></p>')).to.be('<p x="{#a>b#}"></p>')
      expect(render('<p x={ a<b }></p>')).to.be('<p x="{#a<b#}"></p>')
    })

    it('unescape escaped custom or default riot brackets', function() {
      expect(render('\\{ a }')).to.be('{ a }')
      expect(render('<a a="\\{ a \\}">')).to.be('<a a="{ a }">')
      expect(render('\\{ a \\}')).to.be('{ a }')
      expect(render('<p>\\{}</p>')).to.be('<p>{}</p>')
    })

    it('escape internal brackets (only `{#` is nedeed)', function() {
      expect(render('<p>\\{#</p>#}<p>')).to.be('<p>\\{#</p>#}<p>')
      expect(render('<p x="\\{##}"></p>')).to.be('<p x="\\{##}"></p>')
      expect(render('<p x="\\{#}"></p>')).to.be('<p x="\\{#}"></p>')
      expect(render('<p>\\{# a #}</p>')).to.be('<p>\\{# a #}</p>')
    })

    it('removed enumerated/unuseful attributes from the boolean list', function () {
      var att = [
        'async', 'defer', 'defaultchecked', 'defaultmuted', 'defaultselected',
        'draggable', 'spellcheck', 'translate', 'declare', 'indeterminate',
        'pauseonexit', 'enabled', 'visible'
      ]
      for (var i = 0; i < att.length; ++i) {
        expect(render('<p ' + att[i] + '={}>')).to.be('<p ' + att[i] + '="{##}">')
      }
    })

  })

})
