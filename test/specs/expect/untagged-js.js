// fail
riot.tag2('untagged-js1', '<yield></yield> var v = x <y - z>', '', '', function(opts) {
    (x>y ? 1 : 0)
});

// ok
riot.tag2('untagged-js2', '<input type="text">', '', '', function(opts) {
  var v = />\n/
});

// ok
riot.tag2('untagged-js3', '<q>', '', '', function(opts) {
  var v = x<z && x>
    5
});
