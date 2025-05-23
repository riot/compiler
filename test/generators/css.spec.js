import compileCSS, {
  addScopeToSelectorList,
  generateScopedCss,
} from '../../src/generators/css/index.js'
import { evaluateScript, sassPreprocessor } from '../helpers.js'
import { register, unregister } from '../../src/preprocessors.js'
import { createInitialInput } from '../../src/index.js'
import { expect } from 'chai'
import parser from '@riotjs/parser'
import { print } from 'recast'

const simpleCSS = `
<style>
  :host {
    color: red;
  }
</style>
`

const mediaQueryCss = `
<style>
  :host {
    color: red;
  }

  @media (min-width: 500px) {
    :host {
      color: blue;
    }
  }
</style>
`

const sassCSS = `
<style type='sass'>
\\:host
  color: red

  &
    background-color: red

  &::before
    color: green

h1
  color: green
  display: flex

.unmount-animation
  opacity: 1
  transition: opacity 1s

  &.is-unmount
    opacity: 0
</style>
`
const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput({ tagName: 'my-tag' })
}

describe('Generators - CSS', () => {
  before(() => {
    register('css', 'sass', sassPreprocessor)
  })

  after(() => {
    unregister('css', 'sass')
  })

  it('compile a simple css node', () => {
    const { css } = parser().parse(simpleCSS).output

    const ast = compileCSS(
      css,
      simpleCSS,
      {
        options: {
          file: FAKE_FILE,
          scopedCss: true,
        },
        tagName: 'my-tag',
      },
      createInput(),
    )
    const { code } = print(ast)

    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('my-tag')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile css containing media queries', () => {
    const { css } = parser().parse(mediaQueryCss).output

    const ast = compileCSS(
      css,
      simpleCSS,
      {
        options: {
          file: FAKE_FILE,
          scopedCss: true,
        },
        tagName: 'my-tag',
      },
      createInput(),
    )
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.not.have.string('my-tag @media (min-width: 500px)')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a simple css without scoping the css', () => {
    const { css } = parser().parse(simpleCSS).output

    const ast = compileCSS(
      css,
      simpleCSS,
      {
        options: {
          file: FAKE_FILE,
          scopedCss: false,
        },
        tagName: 'my-tag',
      },
      createInput(),
    )
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string(':host')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a sass file and generate a proper sourcemap', () => {
    const { css } = parser().parse(sassCSS).output

    const ast = compileCSS(
      css,
      sassCSS,
      {
        options: {
          file: FAKE_FILE,
          scopedCss: true,
        },
        tagName: 'my-tag',
      },
      createInput(),
    )

    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('[is="my-tag"]')
    expect(code).to.have.string('my-tag h1,[is="my-tag"] h1{ color: green;')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('simple scoped css are properly generated', () => {
    expect(addScopeToSelectorList('my-tag', '')).to.be.equal('')
    expect(addScopeToSelectorList('my-tag', 'from')).to.be.equal('from')
    expect(addScopeToSelectorList('my-tag', 'to')).to.be.equal('to')
    expect(addScopeToSelectorList('my-tag', 'my-tag')).to.be.equal('my-tag')
    expect(addScopeToSelectorList('my-tag', 'my-tag:hover')).to.be.equal(
      'my-tag:hover',
    )
    expect(addScopeToSelectorList('my-tag', ':host')).to.be.equal(
      'my-tag,[is="my-tag"]',
    )
    expect(addScopeToSelectorList('my-tag', 'body :host')).to.be.equal(
      'body my-tag,body [is="my-tag"]',
    )
    expect(addScopeToSelectorList('my-tag', ':host:hover')).to.be.equal(
      'my-tag:hover,[is="my-tag"]:hover',
    )
    expect(
      addScopeToSelectorList('my-tag', ':host:hover > ul > li'),
    ).to.be.equal('my-tag:hover > ul > li,[is="my-tag"]:hover > ul > li')
    expect(addScopeToSelectorList('my-tag', 'input')).to.be.equal(
      'my-tag input,[is="my-tag"] input',
    )
    expect(addScopeToSelectorList('my-tag', '.foo, .bar')).to.be.equal(
      'my-tag .foo,[is="my-tag"] .foo,my-tag .bar,[is="my-tag"] .bar',
    )
    expect(
      addScopeToSelectorList('my-tag', '.foo:hover, .foo:focus'),
    ).to.be.equal(
      'my-tag .foo:hover,[is="my-tag"] .foo:hover,my-tag .foo:focus,[is="my-tag"] .foo:focus',
    )
  })

  it('complex scoped css are properly generated', () => {
    expect(addScopeToSelectorList('my-tag', '.foo:has(.bar,.baz)')).to.be.equal(
      'my-tag .foo:has(.bar,.baz),[is="my-tag"] .foo:has(.bar,.baz)',
    )
    expect(addScopeToSelectorList('my-tag', '.foo:not(.bar,.baz)')).to.be.equal(
      'my-tag .foo:not(.bar,.baz),[is="my-tag"] .foo:not(.bar,.baz)',
    )
    expect(
      addScopeToSelectorList('my-tag', '.foo:where(.bar,.baz)'),
    ).to.be.equal(
      'my-tag .foo:where(.bar,.baz),[is="my-tag"] .foo:where(.bar,.baz)',
    )
    expect(addScopeToSelectorList('my-tag', '.foo:is(.bar,.baz)')).to.be.equal(
      'my-tag .foo:is(.bar,.baz),[is="my-tag"] .foo:is(.bar,.baz)',
    )
    expect(
      addScopeToSelectorList('my-tag', '.foo:is(.bar,.baz) a'),
    ).to.be.equal(
      'my-tag .foo:is(.bar,.baz) a,[is="my-tag"] .foo:is(.bar,.baz) a',
    )
    expect(
      addScopeToSelectorList('my-tag', '.foo :is(.bar,.baz) :is(.d, .e)'),
    ).to.be.equal(
      'my-tag .foo :is(.bar,.baz) :is(.d, .e),[is="my-tag"] .foo :is(.bar,.baz) :is(.d, .e)',
    )
    expect(
      addScopeToSelectorList('my-tag', '.foo:is(.bar,.baz), .bar'),
    ).to.be.equal(
      'my-tag .foo:is(.bar,.baz),[is="my-tag"] .foo:is(.bar,.baz),my-tag .bar,[is="my-tag"] .bar',
    )

    expect(
      addScopeToSelectorList('my-tag', '.foo:hover:active, .bar'),
    ).to.be.equal(
      'my-tag .foo:hover:active,[is="my-tag"] .foo:hover:active,my-tag .bar,[is="my-tag"] .bar',
    )

    expect(
      addScopeToSelectorList('my-tag', '.foo:hover:is(.bar, .baz), .bar'),
    ).to.be.equal(
      'my-tag .foo:hover:is(.bar, .baz),[is="my-tag"] .foo:hover:is(.bar, .baz),my-tag .bar,[is="my-tag"] .bar',
    )

    expect(
      addScopeToSelectorList(
        'my-tag',
        `:host[color='blue'] span, :host[color='red'] span`,
      ),
    ).to.be.equal(
      "my-tag[color='blue'] span,[is=\"my-tag\"][color='blue'] span,my-tag[color='red'] span,[is=\"my-tag\"][color='red'] span",
    )
  })
  it('nested css can be generated', () => {
    expect(
      generateScopedCss(
        'my-tag',
        `
.selector {
  &.something {}
  &:hover {}
}`,
      ),
    ).to.be.equal(
      `my-tag .selector,[is="my-tag"] .selector{
  &.something {}
  &:hover {}
}`,
    )
  })
  it('nested media queries do not affect the selectors scoping', () => {
    expect(
      generateScopedCss(
        'my-tag',
        `
@media (orientation: landscape) {
  .selector {
    &.something {}
    &:hover {}
  }
}
`,
      ),
    ).to.be.equal(
      `
@media (orientation: landscape) {my-tag .selector,[is="my-tag"] .selector{
    &.something {}
    &:hover {}
  }
}
`,
    )
  })
  it('nested @ css directives do not affect the selectors scoping', () => {
    expect(
      generateScopedCss(
        'my-tag',
        `
@media (orientation: landscape) {
  @supports (display:flex) {
    .selector {
      &.something {}
      &:hover {}
    }
  }
}
`,
      ),
    ).to.be.equal(
      `
@media (orientation: landscape) {
  @supports (display:flex) {my-tag .selector,[is="my-tag"] .selector{
      &.something {}
      &:hover {}
    }
  }
}
`,
    )
  })
  it('nested @ css directives do not affect the selectors scoping', () => {
    expect(
      generateScopedCss(
        'my-tag',
        `
import 'style.css';

.selector {
  &.something {}
  &:hover {}
}
`,
      ),
    ).to.be.equal(
      `
import 'style.css';my-tag .selector,[is="my-tag"] .selector{
  &.something {}
  &:hover {}
}
`,
    )
  })
  it('the scoped selectors are properly replaced also in case of simple selectors', () => {
    expect(
      generateScopedCss(
        'my-tag',
        `
import 'style.css';

i {
  color: yellow;
}

/*
* this is a comment 
*/
p {
    color: yellow;
}

b {
    color: yellow;
}
`,
      ),
    ).to.be.equal(
      `
import 'style.css';my-tag i,[is="my-tag"] i{
  color: yellow;
}my-tag p,[is="my-tag"] p{
    color: yellow;
}my-tag b,[is="my-tag"] b{
    color: yellow;
}
`,
    )
  })
})
