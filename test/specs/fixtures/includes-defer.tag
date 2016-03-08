<includes-defer><p onclick={ click }/>
  <!-- included at run-time --><script src="riotjs.object.js" defer></script>
  <!-- filename relative to the parent -->
  <script src="../expect/riotjs.method.js" defer></script>
  <script>      // tagged script
    click (e)
    {foo ({})}
  </script>
</includes-defer>
