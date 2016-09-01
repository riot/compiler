<title>
 <yield /> - { title } <-/>
 <script>
  var self = this;
  self.mixin("bus");
  self.bus.on("settitle", function(title)
   { self.update({"title":title});
   });
 </script>
</title>
