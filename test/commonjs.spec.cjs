const assert = require('node:assert')

describe('commonjs bundle', () => {
  it('commonjs imports work properly', () => {
    const { compile } = require('../dist/index.cjs')

    assert.doesNotThrow(() => compile('<test></test>'))
  })
})
