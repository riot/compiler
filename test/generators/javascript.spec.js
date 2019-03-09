import compileJavascript from '../../src/generators/javascript'
import {createInitialInput} from '../../src/index'
import {evaluateScript} from '../helpers'
import {expect} from 'chai'
import parser  from '@riotjs/parser'
import recast from 'recast'

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
  return createInitialInput({ tagName: 'my-tag' })
}

describe('Generators - javascript', () => {
  it('compile a simple javascript code', () => {
    const { javascript } = parser().parse(simpleJS).output

    const ast = compileJavascript(javascript, simpleJS, { options: {
      file: FAKE_FILE
    }}, createInput())
    const {code} = recast.print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(code).to.have.string('import assert')
    expect(code).to.have.string('return')
    expect(output.default.exports).to.be.ok
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })
})
