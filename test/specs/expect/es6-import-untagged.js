import* as foo from 'doe'
import 'bar'
riot.tag2('import-untagged', '<h1>Hello</h1>', '', '', function(opts) {
  this.Item = {
    important: 'important',
    important_level: 'import'
  }

  this.name = 'foo'
});
