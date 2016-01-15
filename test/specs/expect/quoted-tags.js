//src: test/specs/fixtures/quoted-tags.tag
riot.tag2('q-script', '<div>Content</div>', '', '', function(opts) {
  var stringWithTags = "<script>  <\/script>"
});

riot.tag2('q-script2', '<div>Content</div>', '', '', function(opts) {
  var stringWithTags = '<script>  <\/script>'
});

riot.tag2('q-style', '<div>Content</div>', '', '', function(opts) {
  var stringWithTags = "<style>  <\/style>"
});
