var isNode = typeof window === 'undefined'

describe('Compiler Tests', function() {
  expect = require('expect.js')
  compiler = require('../dist/compiler.js')
  require('shelljs/global')
  require('./server-specs/html')
  require('./server-specs/scoped-css')
  require('./server-specs/riotjs')
  require('./server-specs/tag')
  require('./server-specs/parsers/suite')
})
