
riot.tag2('buble', '<h3>{test}</h3>', '', '', function(opts) {

  var this$1 = this;

  this.parser = 'Buble'

  var type = 'JavaScript'
  this.test = "This is " + type + " with " + (this.parser)

  this.on('mount', function () {
    this$1.parser = 'bublé'
  })

});
