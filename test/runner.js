var isNode = typeof window === 'undefined'

describe('Compiler Tests', function() {
  if (isNode) {
    global.expect = require('expect.js')
  } else {
    mocha.run()
  }
})
