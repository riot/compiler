import compileJavascript from '../../src/generators/javascript'
import {createInitialInput} from '../../src/index'
import {evaluateScript} from '../helpers'
import {expect} from 'chai'
import parser from '@riotjs/parser'
import {print} from 'recast'

const simpleJS = `
<script>
import assert from 'assert'

export function noop () {}

const person = 'person'

const spread = {}
const data = {...spread}

export default {
  person
}

function foo() {
  return 'foo'
}
</script>
`

const rootThisExpressions = `
<script>
import 'assert';

let internalVar = 'internalVar'

const nameToUppercase = () => this.name.toUpperCase()

this.name = 'hello'

this.method = () => {
  this.name = 'goodbye'
}

this.assignement = this.name

this.returnNameToUppercase = () => nameToUppercase()

internalVar = 'internalVar'
</script>
`

const mixedExport = `
<script>
let internalVar = 'internalVar'

this.name = 'hello'

this.method = () => {
  this.name = 'goodbye'
}

export default {
  
}

</script>
`

const typescriptCode = `
<script>
let internalVar:string = 'internalVar'

const name: string = 'hello';

const method = ():number => 3

export default {
  
}

</script>
`

const simpleContextMapping = `
<script>
const ctx = this

ctx.name = 'hello'

</script>
`


const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput({ tagName: 'my-tag' })
}

describe('Generators - javascript', () => {
  it('compile a simple javascript code', () => {
    const { javascript } = parser().parse(simpleJS).output

    const ast = compileJavascript(javascript, simpleJS, {
      options: {
        file: FAKE_FILE
      }
    }, createInput())
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(code).to.have.string('import assert')
    expect(code).to.have.string('return')
    expect(output.default.exports).to.be.ok
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('Convert this root statements into export default declaration', () => {
    const { javascript } = parser().parse(rootThisExpressions).output
    const ast = compileJavascript(javascript, rootThisExpressions, {
      options: {
        file: FAKE_FILE
      }
    }, createInput())
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(output.default.exports).to.be.ok
    expect(output.default.exports().name).to.be.equal('hello')
    expect(output.default.exports().returnNameToUppercase()).to.be.equal('HELLO')
    expect(output.default.exports().method).to.be.a('function')
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('Mixed Exports are not allowed', () => {
    const { javascript } = parser().parse(mixedExport).output
    expect(() => compileJavascript(javascript, mixedExport, {
      options: {
        file: FAKE_FILE
      }
    }, createInput())).to.throw('You can\t use "export default {}" and root this statements in the same component')
  })

  it('The this context can be remapped', () => {
    const { javascript } = parser().parse(simpleContextMapping).output
    const ast = compileJavascript(javascript, simpleContextMapping, {
      options: {
        file: FAKE_FILE
      }
    }, createInput())
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(output.default.exports).to.be.ok
    expect(output.default.exports().name).to.be.equal('hello')
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('Typescript code can be properly parsed', () => {
    const { javascript } = parser().parse(typescriptCode).output
    const ast = compileJavascript(javascript, typescriptCode, {
      options: {
        file: FAKE_FILE
      }
    }, createInput())
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.match(/:number/)
    expect(code).to.match(/:string/)
  })
})
