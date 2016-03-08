/* global describe, expect:true, compiler:true */
/* eslint no-unused-vars: 0 */

describe('Compiler Tests', function () {
  expect = require('expect.js')
  compiler = require('../')
  require('./specs/html')
  require('./specs/css')
  require('./specs/js')
  require('./specs/tag')
  require('./specs/parsers/_suite')
})
