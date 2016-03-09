//src: test/specs/fixtures/whitespace.tag
riot.tag2('my-tag', '<div style=" top:0; left:0" a=" " expr="{{           foo:\'bar\',           bar:⁗\'⁗         }}"> Foo\' </div> <p></p>', 'p { display: none; }', 'style=" top:0; left:0" a=" " expr="{{ foo:⁗bar⁗ }}"', function(opts) {
  this.click = function(e)
  {}.bind(this)
});
