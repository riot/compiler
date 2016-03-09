/* eslint-env mocha */
/* global compiler, expect */
/* eslint max-len: 0 */

describe('Compile fn', function () {
  var fn = compiler.css

  compiler.parsers.css.myParser = function (tag, _css) {
    return _css.replace(/@tag/, tag)
  }

  it('use a custom css parser to render the css', function () {
    var src = '@tag { color: red }',
      css = 'my-tag { color: red }'

    // test old and new API
    expect(compiler.style(src, 'my-tag', 'myParser')).to.equal(css)
    expect(fn(src, 'myParser', { tagName: 'my-tag' })).to.equal(css)
  })

  it('new compiler.css API allows omit parameters (v2.3.20)', function () {
    var css, src = 'p{\ntop:0}\n@tag{top:1}\n'

    // parameters are (css, type-string, opts-object)
    css = 'p{ top:0} undefined{top:1}'
    expect(fn(src, 'myParser', null)).to.be(css)
    expect(fn(src, 'myParser', {})).to.be(css)
    expect(fn(src, 'myParser')).to.be(css)

    css = 'p{ top:0} @tag{top:1}'
    expect(fn(src, 'css', null)).to.be(css)
    expect(fn(src, 'css', {})).to.be(css)
    expect(fn(src, 'css')).to.be(css)
    expect(fn(src, '', null)).to.be(css)
    expect(fn(src, null)).to.be(css)
    expect(fn(src, {})).to.be(css)
    expect(fn(src, '')).to.be(css)
    expect(fn(src)).to.be(css)
  })

  it('a missing CSS parser raises an exception', function () {
    expect(function () {
      fn('p{}', 'unknown')
    }).to.throwError()
  })

  it('compile empty style (simple)', function () {
    expect(fn('h1 {} h2\n{ font-size: 130% } p{}, a\n{top:0}'))
      .to.be('h1 {} h2 { font-size: 130% } p{}, a {top:0}')
  })

})

describe('Scoped CSS', function () {

  function render (str, parser) {
    return compiler.style(str, 'my-tag', parser || 'scoped-css')
  }

  it('scoped option without a tag name raises an exception', function () {
    expect(function () { compiler.style('p{}', '', '', { scoped: 1 }) }).to.throwError()
    expect(function () { compiler.css('p{}', '', { scoped: 1 }) }).to.throwError()
  })

  it('add my-tag to the simple selector', function () {
    expect(render('h1 { font-size: 150% }'))
        .to.equal('my-tag h1,[riot-tag="my-tag"] h1,[data-is="my-tag"] h1{ font-size: 150% }')
  })
  it('add my-tag to the multi selector in a line', function () {
    expect(render('h1 { font-size: 150% } #id { color: #f00 }'))
        .to.equal('my-tag h1,[riot-tag="my-tag"] h1,[data-is="my-tag"] h1{ font-size: 150% } my-tag #id,[riot-tag="my-tag"] #id,[data-is="my-tag"] #id{ color: #f00 }')
  })
  it('add my-tag to the complex selector', function () {
    expect(render('header a.button:hover { text-decoration: none }'))
        .to.equal('my-tag header a.button:hover,[riot-tag="my-tag"] header a.button:hover,[data-is="my-tag"] header a.button:hover{ text-decoration: none }')
  })
  it('add my-tag to the comma-separated selector', function () {
    expect(render('h2, h3 { border-bottom: 1px solid #000 }'))
        .to.equal('my-tag h2,[riot-tag="my-tag"] h2,[data-is="my-tag"] h2,my-tag h3,[riot-tag="my-tag"] h3,[data-is="my-tag"] h3{ border-bottom: 1px solid #000 }')
  })
  it('add my-tag to the attribute selector', function () {
    expect(render('i[class=twitter] { background: #55ACEE }'))
        .to.equal('my-tag i[class=twitter],[riot-tag="my-tag"] i[class=twitter],[data-is="my-tag"] i[class=twitter]{ background: #55ACEE }')
  })
  it('add my-tag to the selector with a pseudo-class', function () {
    expect(render('a:after { content: "*" }'))
        .to.equal('my-tag a:after,[riot-tag="my-tag"] a:after,[data-is="my-tag"] a:after{ content: "*" }')
  })
  it('add my-tag to the selector with multi-line definitions', function () {
    expect(render('header {\n  text-align: center;\n  background: rgba(0,0,0,.2);\n}'))
        .to.equal('my-tag header,[riot-tag="my-tag"] header,[data-is="my-tag"] header{ text-align: center; background: rgba(0,0,0,.2); }')
  })
  it('add my-tag to the root selector', function () {
    expect(render(':scope { display: block }'))
        .to.equal('my-tag,[riot-tag="my-tag"],[data-is="my-tag"]{ display: block }')
  })
  it('add my-tag to the nested root selector', function () {
    expect(render(':scope > ul { padding: 0 }'))
        .to.equal('my-tag > ul,[riot-tag="my-tag"] > ul,[data-is="my-tag"] > ul{ padding: 0 }')
  })
  it('add my-tag to the root selector with attribute', function () {
    expect(render(':scope[disabled] { color: gray }'))
        .to.equal('my-tag[disabled],[riot-tag="my-tag"][disabled],[data-is="my-tag"][disabled]{ color: gray }')
  })
  it('add my-tag to the root selector with class', function () {
    expect(render(':scope.great { color: gray }'))
        .to.equal('my-tag.great,[riot-tag="my-tag"].great,[data-is="my-tag"].great{ color: gray }')
  })
  it('not add my-tag to @font-face', function () {
    expect(render('@font-face { font-family: "FontAwesome" }'))
        .to.equal('@font-face { font-family: "FontAwesome" }')
  })
  it('not add my-tag to @media, and add it to the selector inside', function () {
    expect(render('@media (min-width: 500px) {\n  header {\n    text-align: left;\n  }\n}'))
        .to.equal('@media (min-width: 500px) { my-tag header,[riot-tag="my-tag"] header,[data-is="my-tag"] header{ text-align: left; } }')
  })
  it('not add my-tag to "from" and "to" in @keyframes', function () {
    expect(render('@keyframes fade { from { opacity: 1; } to { opacity: 0; } }'))
        .to.equal('@keyframes fade { from { opacity: 1; } to { opacity: 0; } }')
  })
  it('not add my-tag to parcentage values in @keyframes', function () {
    expect(render('@keyframes fade { 10% { opacity: 1; } 85% { opacity: 0; } }'))
        .to.equal('@keyframes fade { 10% { opacity: 1; } 85% { opacity: 0; } }')
  })

  it('compile empty style (scoped)', function () {
    expect(render('h1 {} h2 { font-size: 130% }'))
        .to.equal('my-tag h1,[riot-tag="my-tag"] h1,[data-is="my-tag"] h1{} my-tag h2,[riot-tag="my-tag"] h2,[data-is="my-tag"] h2{ font-size: 130% }')
  })

})
