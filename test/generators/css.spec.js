import {evaluateScript, scssPreprocessor} from '../helpers'
import {register, unregister} from '../../src/preprocessors'
import compileCSS from '../../src/generators/css'
import {createInitialInput} from '../../src/index'
import {expect} from 'chai'
import parser  from '@riotjs/parser'
import {print} from 'recast'

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
      color: blu;
    }
  }
</style>
`


const scssCSS = `
<style type='scss'>
  :host {
    color: 'red';

    & {
      background-color: red;
    }

    &::before {
      color: 'green'
    }
  }

  h1 {
    color: green;
    display: flex;
  }

  .unmount-animation {
    opacity: 1;
    transition: opacity 1s;

    &.is-unmount {
      opacity: 0;
    }
  }
</style>
`
const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput({ tagName: 'my-tag' })
}

describe('Generators - CSS', () => {
  before(() => {
    register('css', 'scss', scssPreprocessor)
  })

  after(() => {
    unregister('css', 'scss')
  })

  it('compile a simple css node', () => {
    const { css } = parser().parse(simpleCSS).output

    const ast = compileCSS(css, simpleCSS, { options: {
      file: FAKE_FILE,
      scopedCss: true
    }, tagName: 'my-tag' }, createInput())
    const {code} = print(ast)

    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('my-tag')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile css containing media queries', () => {
    const { css } = parser().parse(mediaQueryCss).output

    const ast = compileCSS(css, simpleCSS, { options: {
      file: FAKE_FILE,
      scopedCss: true
    }, tagName: 'my-tag' }, createInput())
    const {code} = print(ast)
    const output = evaluateScript(code)


    expect(ast).to.be.ok
    expect(code).to.not.have.string('my-tag @media (min-width: 500px)')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a simple css without scoping the css', () => {
    const { css } = parser().parse(simpleCSS).output

    const ast = compileCSS(css, simpleCSS,  { options: {
      file: FAKE_FILE,
      scopedCss: false
    }, tagName: 'my-tag'}, createInput())
    const {code} = print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string(':host')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a scss file and generate a proper sourcemap', () => {
    const { css } = parser().parse(scssCSS).output

    const ast = compileCSS(css, scssCSS, { options: {
      file: FAKE_FILE,
      scopedCss: true
    }, tagName: 'my-tag'}, createInput())
    const {code} = print(ast)

    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('[is="my-tag"]')
    expect(code).to.have.string('my-tag h1,[is="my-tag"] h1{\n  color: green;')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })
})
