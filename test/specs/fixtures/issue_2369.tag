// riot/riot#2369
<my-tag>
  <h1>{ getSpaceName(message) }</h1>

  <script>
    this.message = 'display/example/stuff'
    this.getSpaceNameForLink = function(link) {

        return link.match(/display\/(\w+)\//)[1]
    }
  </script>
</my-tag>
