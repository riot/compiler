var isNode = typeof window === 'undefined'

describe('Compiler Tests', function() {
  expect = require('expect.js')
  compiler = require('../dist/compiler.js')
  require('./specs/html')
  require('./specs/scoped-css')
  require('./specs/riotjs')
  require('./specs/tag')
  require('./specs/parsers/suite')
})
