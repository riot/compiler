import {evaluateScript, scssPreprocessor} from '../helpers'
import {register, unregister} from '../../src/preprocessors'
import compileCSS from '../../src/generators/css'
import {createInitialInput} from '../../src/index'
import createSourcemap from '../../src/utils/create-sourcemap'
import {expect} from 'chai'
import parser  from '@riotjs/parser'
import recast from 'recast'

const simpleCSS = `
<style>
  :host {
    color: 'red';
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
  }
</style>
`
const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput(createSourcemap({ file: FAKE_FILE }))
}

describe('Generators - CSS', () => {
  before(() => {
    register('css', 'scss', scssPreprocessor)
  })

  after(() => {
    unregister('css', 'scss')
  })

  it('compile a simple css node', async function() {
    const { css } = parser().parse(simpleCSS).output

    const ast = await compileCSS(css, simpleCSS, {
      file: FAKE_FILE,
      scopedCss: true,
      tagName: 'my-tag'
    }, createInput())
    const {code} = recast.print(ast)

    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('my-tag')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a simple css without scoping the css', async function() {
    const { css } = parser().parse(simpleCSS).output

    const ast = await compileCSS(css, simpleCSS, {
      file: FAKE_FILE,
      scopedCss: false,
      tagName: 'my-tag'
    }, createInput())
    const {code} = recast.print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string(':host')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('compile a scss file and generate a proper sourcemap', async function() {
    const { css } = parser().parse(scssCSS).output

    const ast = await compileCSS(css, scssCSS, {
      file: FAKE_FILE,
      scopedCss: true,
      tagName: 'my-tag'
    }, createInput())
    const {code} = recast.print(ast)
    const output = evaluateScript(code)

    expect(ast).to.be.ok
    expect(code).to.have.string('my-tag')
    expect(output.default.css).to.be.ok
    expect(output.default.tag).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })
})
