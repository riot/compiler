//src: test/specs/fixtures/html-comments.tag
riot.tag2('html-comments', '<div attr="<!-- str -->">Content</div>', '', '', function(opts) {

    var s1 = "<!-- str -->"
        s2 = '<!-- str -->'
});

riot.tag2('html-comments2', '<div>Content</div>', '', '', function(opts) {

  var s1 = "<!-- str -->"
      s2 = '<!-- str -->'

});
