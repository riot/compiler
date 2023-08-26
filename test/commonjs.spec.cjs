const { expect } = require('chai')

describe('commonjs bundle', () => {
  it('commonjs imports work properly', () => {
    const {compile} = require('../dist/index.cjs')

    expect(() => compile('<test></test>')).to.not.throw()
  })
})

