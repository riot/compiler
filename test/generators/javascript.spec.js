import compileJavascript from '../../src/generators/javascript'
import {createInitialInput} from '../../src/index'
import createSourcemap from '../../src/utils/create-sourcemap'
import {evaluateScript} from '../helpers'
import {expect} from 'chai'
import parser  from 'riot-parser'

const simpleJS = `
<script>
import assert from 'assert'

export function noop () {}

const person = 'person'

export default {
  person
}

function foo() {
  return 'foo'
}
</script>
`


const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput(createSourcemap({ file: FAKE_FILE }))
}

describe('Generators - javascript', () => {
  it('compile a simple javascript code', async function() {
    const { javascript } = parser().parse(simpleJS).output

    const { code } = await compileJavascript(javascript, simpleJS, {
      file: FAKE_FILE
    }, createInput())
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(code).to.have.string('import assert')
    expect(code).to.have.string('return')
    expect(output.default.tag).to.be.ok
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })
})
