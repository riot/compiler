<scss-import>
  <button/>
  <style scoped type='scss'>
    @import "scss-import.scss";

    :scope {
      display: inline-block;
    }
    button {
      background: $primary;
      color: $base;
      cursor: pointer;
    }
    button:active {
      background: lighten($primary,20%);
    }
  </style>
  <script>
    foo () {}
  </script>
</scss-import>