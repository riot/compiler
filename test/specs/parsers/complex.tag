
var outer = 'js'

<tag>
  <!-- comment -->
  <p/>

  if (a > b) { /* comment */ }
</tag>

<-t2>
  <p/>

  foo() {
    this.update()
  }
</-t2>

var after = 'js2 <html>'
