riot.tag2('async', '<h1>async test</h1>', '', '', function(opts) {
    this.foo = function(){
      return 'foo'
    }.bind(this)
    this.doAsyncThing =async  function(){
      await new Promise((resolve) =>{setTimeout(resolve,2000)});
      console.log("done");
    }.bind(this)
    this.bar =*  function(){
      yield baz
    }.bind(this)
});
