/* global compiler */
import { expect } from '../node_modules/chai/chai.js'

describe('Browser runtime compilation', () => {
  it('it compiles tags in the browser', () => {
    expect(() =>
      compiler
        .compile(
          `<each-and-events>
            <item each={item in items} onclick={doSomething}></item></each-and-events>`,
        )
        .to.not.throw(),
    )
  })

  it('native apis are not scoped', () => {
    const { code } = compiler.compile('<native>{new Date()}</native>')
    expect(code).to.match(/new Date\(\)/)
  })

  it('object arguments are properly scoped', () => {
    const { code } = compiler.compile(
      `<time>{ test({ foo: 'foo', bar: 'bar', baz: baz })}</time>`,
    )

    expect(code).to.match(/ baz: _scope\.baz/)
    expect(code).to.match(/ foo: 'foo'/)
    expect(code).to.match(/ bar: 'bar'/)
  })

  it('object spread operator is supported', () => {
    expect(() =>
      compiler.compile(`
<my-tag>
  <script>
      export default {
        onBeforeMount(props, state) {
          state.profile = {...props}
        },
      }    
  </script>
</my-tag>`),
    ).to.not.throw()
  })
})
