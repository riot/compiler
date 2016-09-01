riot.tag2('title', '<yield></yield> - {title}', '', '', function(opts) {
  var self = this;
  self.mixin("bus");
  self.bus.on("settitle", function(title)
   { self.update({"title":title});
   });
});
