import compileJavascript from '../../src/generators/javascript'
import {createOutput} from '../../src/transformer'
import {expect} from 'chai'
import parser  from 'riot-parser'

const simpleJS = `
<script>
import moment from 'moment'

const person = 'person'

export default {
  person
}
</script>
`


const FAKE_FILE = 'fake-file.js'


describe('Generators - javascript', () => {
  it('compile a simple javascript code', async function() {
    const { javascript } = parser().parse(simpleJS).output

    const { code } = await compileJavascript(javascript, simpleJS, {
      file: FAKE_FILE
    }, createOutput(null, { file: FAKE_FILE }))

    expect(code).to.be.a('string')
    expect(code).to.have.string('import moment')
    expect(code).to.have.string('return')
    expect(code.length).to.be.ok
  })
})
