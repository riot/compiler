<less-import>
  <button/>
  <style scoped type='less'>
    @import "less-import.less";

    :scope {
      display: inline-block;
    }
    button {
      background: @primary;
      color: fadeout(@base, @textfadeout);
      cursor: pointer;
    }
    button when (luma(@primary) < 50%) {
      color: fadeout(@reverse, @textfadeoutreverse);
    }
    button:active {
      background: lighten(@primary,20%);
    }
  </style>
  <script>
    foo () {}
  </script>
</less-import>