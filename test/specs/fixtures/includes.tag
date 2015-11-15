// free indent
<includes><p onclick={ click }/>
  <!-- included at compile-time --><script src="riotjs.object.js"></script>
  <!-- filename relative to the parent -->
  <script src="../expect/riotjs.method.js"></script>
  <script>      // tagged script
    click (e)   // free style, this comment does not break the parser
    {foo ({})}
  </script>
  /*
    untagged script block starts here
  */
  handle( e )   // another style
  {
    bar( {} )
  }
  .bind (this)
</includes>
