/* global chai, compiler */

const { expect } = chai

describe('Browser runtime compilation', () => {
  it('it compiles tags in the browser', () => {
    expect(
      () => compiler.compile(`<each-and-events>
            <item each={item in items} onclick={doSomething}></item></each-and-events>`
      ).to.not.throw
    )
  })

  it('native apis are not scoped', () => {
    const { code } = compiler.compile('<native>{new Date()}</native>')
    expect(code).to.match(/new Date\(\)/)
  })
})