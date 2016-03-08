/* eslint-env mocha */
/* global compiler, expect */
/* eslint max-len: 0 */

describe('Compile HTML', function () {

  function render (str, opts) {
    return compiler.html(str, opts || {})
  }

  function testStr (str1, str2, opts) {
    expect(render(str1, opts)).to.be(str2)
  }

  it('compiles void tag into separated: <x/> -> <x></x>', function () {
    testStr('<p/>', '<p></p>')
    testStr('<a><b/></a>', '<a><b></b></a>')
    testStr('<my-tag value={ test }/>', '<my-tag value="{test}"></my-tag>')
  })

  it('adds the prefix `riot-` to some attributes', function () {
    testStr('<img src={ a }>', '<img riot-src="{a}">')
    testStr('<p style="left:0; top={ n }">', '<p riot-style="left:0; top={n}">')
  })

  it('adds the prefix `__` to boolean attributes with expressions', function () {
    testStr('<a disabled={ a } nowrap="{ b }">', '<a __disabled="{a}" __nowrap="{b}">')
    testStr('<a disabled readonly={}>', '<a disabled __readonly="{}">')
    testStr('<a readonly=readonly autofocus={1}>', '<a readonly="readonly" __autofocus="{1}">')
  })

  it('adds double quotes to the attribute value', function () {
    testStr('<a a={ a }>', '<a a="{a}">')
    testStr("<a a='{ a }'>", '<a a="{a}">')
    testStr('<a a={ a } b={ b }>', '<a a="{a}" b="{b}">')
    testStr('<a id={ a }/>', '<a id="{a}"></a>')
    testStr('<input id={ a }/>', '<input id="{a}">')
  })

  it('keeps interpolations', function () {
    testStr('<a href="a?b={ c }">', '<a href="a?b={c}">')
    testStr('<a id="{ a }b">', '<a id="{a}b">')
  })

  it('skips HTML comments', function () {
    testStr('{ a }<!-- c -->', '{a}')
    testStr('<!-- c -->{ a }', '{a}')
    testStr('<!-- c -->{ a }<!-- c --><p/><!-- c -->', '{a}<p></p>')
  })

  it('option `whitespace` normalizes and preserves line endings', function () {
    testStr('<p>a\r</p>\r\r\n<p>\n</p>', '<p>a\n</p>\n\n<p>\n</p>', { whitespace: 1 })
  })

  it('option `compact` removes line endings between tags', function () {
    testStr('<p>a\r</p>\r\r\n<p>\n</p>', '<p>a </p><p></p>', { compact: 1 })
  })

  describe('2.3.0', function () {

    it('fix #827 input type=number and expression in the value', function () {
      testStr('<input type=number>', '<input type="number">') // no value
      testStr('<input type=number value=1>', '<input value="1" type="number">') // no expression
      testStr('<input type=number value={ 1 }>', '<input value="{1}" type="{\'number\'}">')
    })

    it('fix #1495 Warning of input tag value (date/time/month/email/color)', function () {
      testStr('<input type=date value={d}>', '<input value="{d}" type="{\'date\'}">')
      testStr('<input type=time value={t}>', '<input value="{t}" type="{\'time\'}">')
      testStr('<input type=date-local value={dl}>', '<input value="{dl}" type="{\'date-local\'}">')
      testStr('<input type=datetime value={dt}>', '<input value="{dt}" type="{\'datetime\'}">')
      testStr('<input type=month value={m}>', '<input value="{m}" type="{\'month\'}">')
      testStr('<input type=email value={e}>', '<input value="{e}" type="{\'email\'}">')
      testStr('<input type=color value={c}>', '<input value="{c}" type="{\'color\'}">')
    })

    it('normalizes attributes, all values in double quotes', function () {
      testStr('<a a={a} b=number c =\'x\'>', '<a a="{a}" b="number" c="x">')
    })

    it('lf/cr in attribute values are compacted to space', function () {
      testStr("<p\r\n a\t= ' {a}' b='{b}\n'\n\n>", '<p a=" {a}" b="{b} ">')
      testStr("<p\ta ='p:{}\r\n;'>", '<p a="p:{} ;">')
    })

    it('nested double quotes are supported in expressions', function () {
      testStr('<p x={ "a" } y="{2}">', '<p x="{\u2057a\u2057}" y="{2}">')
      testStr('<p x="{"a"}" y="{2}">', '<p x="{\u2057a\u2057}" y="{2}">')
      testStr('<p x=\'{"a"}\' y="{2}">', '<p x="{\u2057a\u2057}" y="{2}">')
      testStr('<p x="{""}">', '<p x="{\u2057\u2057}">')
    })

    it('single quotes in expressions are escaped', function () {
      testStr("<p x={ 'a' } y='{2}'>", '<p x="{\'a\'}" y="{2}">')
      testStr("<p x='{'a'}' y='{2}'>", '<p x="{\'a\'}" y="{2}">')
      testStr("<p x=\"{'a'}\" y='{2}'>", '<p x="{\'a\'}" y="{2}">')
      testStr("<p x='{''}'>", '<p x="{\'\'}">')
    })

    it('preserves `<` and `>` operators in expressions', function () {
      testStr('<p x={ a>b }></p>', '<p x="{a>b}"></p>')
      testStr('<p x={ a<b }></p>', '<p x="{a<b}"></p>')
    })

    // compile.html must preserve escaped brackets
    it('preserves escaped riot brackets', function () {
      testStr('\\{ a }', '\\{ a }')
      testStr(' \\{ a \\}', '\\{ a \\}')   // trim is ok
      testStr('<a a="\\{ a \\}">', '<a a="\\{ a \\}">')
      testStr('<p>\\{}</p>', '<p>\\{}</p>')
    })

    /*
      don't needed in version for non precompiled expressions
    it('escape internal brackets (only `{` is nedeed)', function() {
      testStr('<p>\\{</p>}<p>', '<p>\\{</p>}<p>')
      testStr('<p x="\\{}"></p>', '<p x="\\{}"></p>')
      testStr('<p x="\\{}"></p>', '<p x="\\{}"></p>')
      testStr('<p>\\{ a }</p>', '<p>\\{ a }</p>')
    })
    */

    it('removed enumerated/unuseful attributes from the boolean list', function () {
      var att = [
        'async', 'defer', 'defaultchecked', 'defaultmuted', 'defaultselected',
        'draggable', 'spellcheck', 'translate', 'declare', 'indeterminate',
        'pauseonexit', 'enabled', 'visible'
      ]

      for (var i = 0; i < att.length; ++i) {
        testStr('<p ' + att[i] + '={}>', '<p ' + att[i] + '="{}">')
      }
    })

    /*
    it('raw html detection through the `=` flag', function () {
      testStr(
        '<p>{= \'<\' + myElem + \' style="color: \' + myColor + \';">\\n Click me</\' + myElem + \'>\'}</p>',
        '<p>{= \'&lt;\' + myElem + \' style=\u2057color: \' + myColor + \';\u2057&gt;\\n Click me&lt;/\' + myElem + \'&gt;\'}</p>')
      testStr(
        '<ul><li>{= ["foo", "bar"].join(\'<br/>\') }</li></ul>',
        '<ul><li>{= [\u2057foo\u2057, \u2057bar\u2057].join(\'&lt;br/&gt;\')}</li></ul>')
    })*/

    it('new compiler.html API allows omit the options (v2.3.20)', function () {
      var js, ex = []

      js = compiler.html('<p a={ 0 }/>', ex)
      expect(js).to.be('<p a="{0}"></p>')
      expect(ex.length).to.be(1)
      expect(ex[0].trim()).to.be('0')

      js = compiler.html('<p a={ 5 }/>', null, ex)
      expect(js).to.be('<p a="{5}"></p>')
      expect(ex.length).to.be(2)            // previous content must be not destroyed
      expect(ex[0].trim()).to.be('0')
      expect(ex[1].trim()).to.be('5')

      js = compiler.html('<p a={ 0 }/>')
      expect(js).to.be('<p a="{0}"></p>')
    })

  })

})
