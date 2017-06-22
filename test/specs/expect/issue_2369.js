riot.tag2('bug-2369', '<h1>{getSpaceName(message)}</h1>', '', '', function(opts) {
    this.message = 'display/example/stuff'
    this.getSpaceName = function(link) {
        return link.match(/display\/(\w+)\//)[1]
    }
});
