riot.tag2('file-editor', '', '', '', function(opts) {

    this.getFilePathId = function( filePath )
    {
      var filePathId = filePath.replace( /[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '_' );

      return filePathId;
    }.bind(this)

    this.getTabId = function( filePath )
    {
      var tabId = this.getFilePathId( filePath ) + '_tab';
      return tabId;
    }.bind(this)

    this.testing123 = function( test )
    {
      var tester = "example method";
      return tester;
    }.bind(this)

});
