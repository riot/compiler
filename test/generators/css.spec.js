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

/*
const scssCSS = `
<style>
  :root {
    color: 'red';

    & {
      background-color: red;
    }
  }
</style>
*/

const FAKE_FILE = 'fake-file.js'


describe('Generators - CSS', () => {
  it('compile a simple css node', async function() {
    const { css } = parser().parse(simpleCSS).output

    const { code, map } = await compileCSS(css, simpleCSS, {
      file: FAKE_FILE
    }, createOutput(null, { file: FAKE_FILE }))


    expect(map.mappings.split(',')).to.have.length(4)
    expect(code).to.be.a('string')
  })

/*
  it('compile a scss file and generate a proper sourcemap', async function() {
    const { css } = parser().parse(scssCSS).output

    const { code, map } = await compileCSS(css, scssCSS, {
      file: FAKE_FILE
    }, createOutput(null, { file: FAKE_FILE }))


    expect(map.mappings.split(',')).to.have.length(4)
    expect(code).to.be.a('string')
  })
*/
})
