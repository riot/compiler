//src: test/specs/fixtures/raw-html.tag
riot.tag2('raw-html', '<p>{= [address1,address2].join(\'&lt;br&gt;\')}</p> <p onclick="{swap}"> {= \'&lt;\' + myElem + \' style=⁗color: \' + myColor + \';⁗&gt;\\n  Click\\n&lt;/\' + myElem + \'&gt;&lt;br&gt;\\n&lt;b&gt;me&lt;/b&gt;\'} </p>', '', '', function(opts) {

  this.address1 = '1234 Peachtree'
  this.address2 = 'Atlanta'
  this.myElem = 'span'
  this.myColor = 'red'
  this.swap = function() {
    this.myElem = this.myElem === 'span' ? 'p' : 'span'
  }.bind(this)
});
