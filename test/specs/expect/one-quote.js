//src: test/specs/fixtures/one-quote.tag
// riot#1511
riot.tag2('one-squote', '<h1>Single quote\'</h1>', '', '', function(opts) {
    var a = 'test';
});

riot.tag2('one-rquote', '<h1>Single quote\'</h1>', '', 'foo="{⁗\'⁗}" bar="\'"', function(opts) {
  var a = 'test';
});

riot.tag2('one-dquote', '<h1>Double quote"</h1>', '', '', function(opts) {
    var a = "test";
});
