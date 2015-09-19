// free indent
riot.tag2('my-tag', '<p onclick="#@425738920#"></p><p foo="#@02220442150#"></p>', '', '', function(opts) {
// src: riotjs.object.js
  this.myObj = {
    foo: 'bar',
    baz: 'foo'
  }


      this.click = function(e)
      {foo ({})}.bind(this)


    this.handle = function( e )
    {
      bar( {} )
    }
    .bind (this)

}, {"@425738920":function(G){return ("click"in this?this:G).click}, "@02220442150":function(G){return ("myObj"in this?this:G).myObj.foo < 'bar'}});
