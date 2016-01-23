// fail
<untagged-js1>
  <yield/>
  var v = x <y - z>
    (x>y ? 1 : 0)
</untagged-js1>

// ok
<untagged-js2>
  <input
    type="text">
  var v = />\n/
</untagged-js2>

// ok
<untagged-js3>
  <q>
  var v = x<z && x>
    5
</untagged-js3>
