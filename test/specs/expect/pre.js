//src: test/specs/fixtures/pre.tag
riot.tag2('pre-tag', '<pre>xyz\n    cc\n      ss</pre> <pre-fake>xyz cc ss</pre-fake> <pre x="{1>2}" y="{3}">xyz\n    cc\n      ss</pre>', '', '', function(opts) {
});

riot.tag2('pre-tag2', '<pre>xyz\n    cc\n      ss</pre> <pre-x> cc ss</pre-x>', '', '', function(opts) {
});

riot.tag2('pre-tag3', '<pre></pre> <pre-x> cc ss</pre-x>', '', '', function(opts) {
});
