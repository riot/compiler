
var regEx = require('riot-tmpl').regEx,
  S_PCESRC = regEx.PCE_TEST.source

function render(str, opts, pcex) {
  return compiler.html(str, opts || {}, pcex)
}

function checkMatch(tagStr, testStr, rePCExpr, opts) {
  var
    pcex = [],    // pass to compiler.html to get pcexpr list
    re = new RegExp(testStr
                    .replace(/(?=[-[\]()*+?.^$|#{\\])/g, '\\')
                    .replace(/@ID/g, S_PCESRC))

  var result = render(tagStr, opts, pcex)
  expect(result).to.match(re)

  if (rePCExpr) {
    if (!Array.isArray(rePCExpr)) rePCExpr = [rePCExpr]
    var
      len = rePCExpr.length,
      err = ''

    for (var i = 0; i < len && !err; ++i) {
      if (!rePCExpr[i].test(pcex[i]))
        err = 'Test failed for expr ' + rePCExpr[i] + '\n'
    }
    if (rePCExpr.length !== pcex.length)
      err += 'pcex length expected to be ' + rePCExpr.length + '\n'
    if (err)
      throw new Error(err + 'pcex: [\n' + pcex.join(',\n') + '\n]')
  }
}

describe('Compile HTML', function() {

  it('compiles void tag into separated: <x/> -> <x></x>', function() {
    expect(render('<p/>')).to.be('<p></p>')
    expect(render('<a><b/></a>')).to.be('<a><b></b></a>')
    checkMatch('<my-tag value={ test }/>', '<my-tag value="@ID"></my-tag>')
  })

  it('adds the prefix `riot-` to some attributes', function() {
    checkMatch('<img src={ a }>', '<img riot-src="@ID">')
  })

  it('adds the prefix `__` to boolean attributes', function() {
    checkMatch('<a disabled={ a } nowrap="{ b }">', '<a __disabled="@ID" __nowrap="@ID">')
  })

  it('adds double quotes to the attribute value', function() {
    checkMatch('<a a={ a }>', '<a a="@ID">')
    checkMatch("<a a='{ a }'>", '<a a="@ID">')
    checkMatch('<a a={ a } b={ b }>', '<a a="@ID" b="@ID">')
    checkMatch('<a id={ a }/>', '<a id="@ID"></a>')
    checkMatch('<input id={ a }/>', '<input id="@ID">')
  })

  it('keeps interpolations', function() {
    checkMatch('<a href="a?b={ c }">', '<a href="a?b=@ID">', /\.c\b/)
    checkMatch('<a id="{ a }b">', '<a id="@IDb">', /\.a\b/)
  })

  it('skips HTML comments', function() {
    checkMatch('{ a }<!-- c -->', '@ID')
    checkMatch('<!-- c -->{ a }', '@ID')
    checkMatch('<!-- c -->{ a }<!-- c --><p/><!-- c -->', '@ID<p></p>')
  })

  it('unescape escaped riot brackets', function() {
    checkMatch('{ "a" }', '@ID', /return "a"/)  // expressions now live only in js, '&quot;a&quot;' makes no sense
    expect(render('<a a="\\{ a \\}">')).to.be('<a a="{ a }">')
    expect(render('\\{ a \\}')).to.be('{ a }')
  })

  it('mormalizes line endings', function() {
    expect(render('<p>\r</p>\r\r\n<p>\n</p>', { whitespace: 1 })).to.be('<p>\\n</p>\\n\\n<p>\\n</p>')
  })


  describe('2.4', function () {

    it('removed enumerated/unuseful attributes from the boolean list', function () {
      var att = [
        'async', 'defer', 'defaultchecked', 'defaultmuted', 'defaultselected',
        'draggable', 'spellcheck', 'translate', 'declare', 'indeterminate',
        'pauseonexit', 'enabled', 'visible'
      ]
      for (var i = 0; i < att.length; ++i) {
        expect(render('<p ' + att[i] + '={}>')).to.contain('<p ' + att[i] + '=')
      }
    })

    // fix #827
    it('fix to input type=number is working', function () {
      expect(render('<input type=number>')).to.be('<input type="' + regEx.E_NUMBER + '">')
    })

    it('preformatted `each` attribute', function () {
      checkMatch('<p each={ item,i in items }>', ' each="item,i,@ID"', /\.items\b/)
      checkMatch('<p EACH={i in items}>', ' each="i,,@ID"', /\.items\b/)
      checkMatch('<p\teach=\'{ items }\'>', ' each="@ID"', /\.items\b/)
      checkMatch('<p EACH="{\nitem in i}">', ' each="item,,@ID"', /\.i\b/)
      checkMatch('<p each="0">', ' each="0"')
    })

    it('double quotes in expressions (double quotes inside double quotes)', function () {
      checkMatch('<p attr1={ "a" } attr2="{2}">', '<p attr1="@ID" attr2="', [/"a"/, /2/])
      checkMatch('<p attr1="{"a"}" attr2="{2}">', '<p attr1="@ID" attr2="', [/"a"/, /2/])
      checkMatch('<p attr1=\'{"a"}\' attr2="{2}">', '<p attr1="@ID" attr2="', [/"a"/, /2/])
      checkMatch('<p attr1="{""}">', '<p attr1="@ID">', /""/)
    })

    it('single quotes in expressions (single quotes inside single quotes)', function () {
      checkMatch("<p attr1={ 'a' } attr2='{2}'>", '<p attr1="@ID" attr2="', [/'a'/, /2/])
      checkMatch("<p attr1='{'a'}' attr2='{2}'>", '<p attr1="@ID" attr2="', [/'a'/, /2/])
      checkMatch("<p attr1=\"{'a'}\" attr2='{2}'>", '<p attr1="@ID" attr2="', [/'a'/, /2/])
      checkMatch("<p attr1='{''}'>", '<p attr1="@ID">', /''/)
    })

    it('`<` and `>` operators in expressions', function () {
      checkMatch('<p attr1={ a>b }></p>', '<p attr1="@ID"></p>', /\.a>/)
      checkMatch('<p attr1={ a<b }></p>', '<p attr1="@ID"></p>', /\.a</)
    })

    it('normalization of the attributes', function () {
      checkMatch('<a a = {a} b\n=number \tc =\'x\' \n>', '<a a="@ID" b="number" c="x">')
      checkMatch("<a\n a= ' { a }' b='{b}\n'/>", '<a a=" @ID" b="@ID "></a>')
    })

    it('do not duplicate the same precompiled expression (exact after trim)', function () {
      var pcex = [],    // pass to compiler.html to get pcexpr list
        result = render('<p a={a<b} b={ a<b } >', {}, pcex)
      expect(pcex).to.have.length(1)
      // this is different
      pcex = []
      result = render('<p a={ a < b } b={ a<b } >', {}, pcex)
      expect(pcex).to.have.length(2)
    })

  })

})

describe('Custom parser in expressions', function() {

  var opts = { parser: parser, expr: true }

  // custom parser
  function parser(str) { return '@' + str }

  function wrapvar(v) {
    return new RegExp(' @\\("' + v + '"in this\\?this:G\\)\\.' + v + '\\b')
  }

  it('with unquoted values', function() {
    checkMatch('<a href={ a }>', '<a href="@ID">', wrapvar('a'), opts)
    checkMatch('<a>{ b }</a>', '<a>@ID</a>', wrapvar('b'), opts)
  })

  it('quoted values are preserved', function() {
    checkMatch('<a href={ "a" }>', '<a href="@ID">', / @"a"/, opts)
    checkMatch('<a>{ "b" }</a>', '<a>@ID</a>', / @"b"/, opts)
  })

  it('prefixing the expression with "^" prevents the parser', function() {
    checkMatch('<a href={^ "a" }>', '<a href="@ID">', / "a"/, opts)
    checkMatch('<a>{^ "b" }</a>', '<a>@ID</a>', / "b"/, opts)
  })

})
