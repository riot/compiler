<file-editor>
  <script>

    getFilePathId( filePath )
    {
      var filePathId = filePath.replace( /[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '_' );

      return filePathId;
    }

    getTabId( filePath )
    {
      var tabId = this.getFilePathId( filePath ) + '_tab';
      return tabId;
    }

    testing123( test )
    {
      var tester = "example method";
      return tester;
    }

  </script>
</file-editor>
