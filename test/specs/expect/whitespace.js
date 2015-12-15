//src: test/specs/fixtures/whitespace.tag
riot.tag2('my-tag', '<p></p>', 'p { display: none; }', 'style=" top:0; left:0" expr="{{ foo:⁗bar⁗ }}"', function(opts) {
  this.click = function(e)
  {}.bind(this)
}, '{ }');
