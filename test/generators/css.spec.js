import compileCSS from '../../src/generators/css'
import {createOutput} from '../../src/transformer'
import {expect} from 'chai'
import parser  from 'riot-parser'

const simpleCSS = `
<style>
  :root {
    color: 'red';
  }
</style>
`

const FAKE_FILE = 'fake-file.js'


describe('Generators - CSS', () => {
  it('compile a simple css node', async function() {
    const { css } = parser().parse(simpleCSS).output

    const { code } = await compileCSS(css, simpleCSS, {
      file: FAKE_FILE
    }, createOutput(null, { file: FAKE_FILE }))

    expect(code).to.be.a('string')
  })
})
