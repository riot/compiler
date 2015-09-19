riot.tag2('content', '<div class="box"> <h1>#@091103179#</h1> <img riot-src="#@05366290856#" width="480"> <div class="body">#@3914520549#</div> </div>', '', '', function(opts) {

  this.box = {
      title: "Good morning!",
      image: "http://trinixy.ru/pics5/20130614/podb_07.jpg",
      body: "It is when SO!"
  }

}, {"@091103179":function(G){return ("box"in this?this:G).box.title}, "@05366290856":function(G){return ("box"in this?this:G).box.image}, "@3914520549":function(G){return ("box"in this?this:G).box.body}});