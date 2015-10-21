// alternative to nested custom tags using the comment hack.
// as the compiler expects only blanks after closing the tag, the inline
// comment following the first closing tag prevents the compiler sees it.
<treeitem>

  <div class={ bold: isFolder() } onclick={ toggle } ondblclick={ changeType }>
    { name }
    <span if={ isFolder() }>[{open ? '-' : '+'}]</span>
  </div>

  <ul if={ isFolder() } show={ isFolder() && open }>
    <li each={ child, i in nodes }>
      <treeitem data={child}></treeitem> <!-- hack -->
    </li>
    <li onclick={ addChild }>+</li>
  </ul>

  <script>
  var self = this
  </script>

</treeitem>
