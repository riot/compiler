function render(str, opt, pcex) {
  return compiler.html(str, opt || {}, pcex)
}

function checkMatch(tagStr, testStr, exprs, opt) {
  var pcex = [],
      regexp = new RegExp(
        testStr.replace(/(?=[[$\.?+*{()|^\\])/g, '\\').replace(/@ID/g, '#@-?\\d+#'))

  expect(render(tagStr, opt, pcex)).to.match(regexp)

  if (exprs) {
    if (!Array.isArray(exprs)) exprs = [exprs]
    var len = Math.min(exprs.length, pcex.length)
        err = ''

    for (var i = 0; i < len && !err; ++i) {
      if (!exprs[i].test(pcex[i]))
        err = 'Test failed for expr ' + exprs[i] + '\n'
    }
    if (exprs.length !== pcex.length)
      err += 'pcex length expected to be ' + exprs.length + '\n'
    if (err)
      throw new Error(err + 'pcex: [\n' + pcex.join(',\n') + '\n]')
  }
}

describe('Compile HTML', function() {

  it('compiles void tag into separated: <x/> -> <x></x>', function() {
    expect(render('<p/>')).to.equal('<p></p>')
    expect(render('<a><b/></a>')).to.equal('<a><b></b></a>')
    checkMatch('<my-tag value={ test }/>', '<my-tag value="@ID"></my-tag>')
  })
  it('adds prefix `riot-` to some attributes', function() {
    checkMatch('<img src={ a }>', '<img riot-src="@ID">')
  })
  it('adds prefix __ to the BOOL_ATTR', function() {
    checkMatch('<a loop={ a } defer="{ b }" visible>', '<a __loop="@ID" __defer="@ID" visible>')
  })
  it('adds double quot to the value of attr', function() {
    checkMatch('<a a={ a }>', '<a a="@ID">')
    checkMatch("<a a='{ a }'>", '<a a="@ID">')
    checkMatch('<a a={ a } b={ b }>', '<a a="@ID" b="@ID">')
    checkMatch('<a id={ a }/>', '<a id="@ID"></a>')
    checkMatch('<input id={ a }/>', '<input id="@ID">')
  })
  it('keeps interpolations', function() {
    checkMatch('<a href="a?b={ c }">', '<a href="a?b=@ID">')
    checkMatch('<a id="{ a }b">', '<a id="@IDb">')
  })
  it('skips HTML comments', function() {
    checkMatch('{ a }<!-- c -->', '@ID')
    checkMatch('<!-- c -->{ a }', '@ID')
    checkMatch('<!-- c -->{ a }<!-- c --><p/><!-- c -->', '@ID<p></p>')
  })
  it('unescape escaped riot brackets', function() {
    checkMatch('{ "a" }', '@ID', /return "a"/)  // expressions now live only in js, '&quot;a&quot;' makes no sense
    expect(render('<a a="\\{ a \\}">')).to.equal('<a a="{ a }">')
    expect(render('\\{ a \\}')).to.equal('{ a }')
  })
  it('mormalizes line endings', function() {
    expect(render('<p>\r</p>\r\r\n<p>\n</p>', { whitespace: 1 })).to.equal('<p>\\n</p>\\n\\n<p>\\n</p>')
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

  it('with prefix ^ avoids the parser', function() {
    checkMatch('<a href={^ "a" }>', '<a href="@ID">', / "a"/, opts)
    checkMatch('<a>{^ "b" }</a>', '<a>@ID</a>', / "b"/, opts)
  })

})
