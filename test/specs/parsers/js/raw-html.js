riot.tag2('raw-html', '<p>{= [address1,address2].join(\'&lt;br&gt;\') }</p> <p onclick="{swap}"> {= \'<\' + myElem + \' style="color: \' + myColor + \';">\\n Click\\n</\' + myElem + \'><br>\\n<b>me</b>\' } </p>', '', '', function(opts) {

  this.address1 = '1234 Peachtree'
  this.address2 = 'Atlanta'
  this.myElem = 'span'
  this.myColor = 'red'
  this.swap = function() {
    this.myElem = this.myElem === 'span' ? 'p' : 'span'
  }.bind(this)
});
