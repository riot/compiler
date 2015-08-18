var isNode = typeof window === 'undefined'

describe('Compiler Tests', function() {
  global.expect = require('expect.js')
  global.compiler = require('../index')
  require('shelljs/global')
  require('./server-specs/html')
  require('./server-specs/scoped-css')
  require('./server-specs/riotjs')
  require('./server-specs/tag')
  require('./server-specs/parsers/suite')
})
