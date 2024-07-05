import compileJavascript from '../../src/generators/javascript/index.js'
import { createInitialInput } from '../../src/index.js'
import { evaluateScript } from '../helpers.js'
import { expect } from 'chai'
import parser from '@riotjs/parser'
import { print } from 'recast'

const simpleJS = `
<script>
import assert from 'node:assert'

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
import 'node:assert';

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

const onlyNamedExport = `
<script>
export const hello = 'hello'
</script>
`

const simpleContextMapping = `
<script>
const ctx = this

ctx.name = 'hello'

</script>
`

const interfacesExport = `
<script lang='ts'>
import {withTypes, RiotComponent} from 'riot'

export interface ARandomInterface {
    foo: string
    bar: number
}
  
export interface MyComponentProps {
  username: string
}
  
export type MyComponentState = {
  message: string
}
  
export interface ComponentInterface extends RiotComponent<MyComponentProps, MyComponentState> {
    onClick(event: MouseEvent): void
}
  
export default withTypes<ComponentInterface>({
    state: {
        message: 'hello'
    },
    onClick(event: MouseEvent) {
        this.update({
            message: 'goodbye'
        })
    }
})
</script>
`

const interfacesExportWithoutRiotImport = `
<script lang='ts'>
export interface ARandomInterface {
    foo: string
    bar: number
}
  
export interface MyComponentProps {
  username: string
}
  
export type MyComponentState = {
  message: string
}
  
export interface ComponentInterface extends RiotComponent<MyComponentProps, MyComponentState> {
    onClick(event: MouseEvent): void
}
  
export default withTypes<ComponentInterface>({
    state: {
        message: 'hello'
    },
    onClick(event: MouseEvent) {
        this.update({
            message: 'goodbye'
        })
    }
})
</script>
`

const typesExport = `
<script lang="ts">
  import {withTypes, RiotComponent} from 'riot'

  export type MyComponentProps = {
    username: string
  }

  export interface MyComponentState {
    message: string
  }

  export type ComponentInterface = RiotComponent<MyComponentProps, MyComponentState> & {
    onClick(event: MouseEvent): void
  }
        
  export default withTypes<ComponentInterface>({
    state: {
      message: 'hello'
    },
    onClick(event: MouseEvent) {
      this.update({
        message: 'goodbye'
      })
    }
  })
</script>
`

const typesExportWithoutRiotImport = `
<script lang="ts">
  export type MyComponentProps = {
    username: string
  }

  export interface MyComponentState {
    message: string
  }

  export type ComponentInterface = RiotComponent<MyComponentProps, MyComponentState> & {
    onClick(event: MouseEvent): void
  }
        
  export default withTypes<ComponentInterface>({
    state: {
      message: 'hello'
    },
    onClick(event: MouseEvent) {
      this.update({
        message: 'goodbye'
      })
    }
  })
</script>
`

const typesAliasExportWithoutRiotImport = `
<script lang="ts">
  export type MyComponentProps = {
    username: string
  }

  export interface MyComponentState {
    message: string
  }

  export type ComponentInterface = RiotComponent<MyComponentProps, MyComponentState>
        
  export default withTypes<ComponentInterface>({
    state: {
      message: 'hello'
    },
    onClick(event: MouseEvent) {
      this.update({
        message: 'goodbye'
      })
    }
  })
</script>
`

const FAKE_FILE = 'fake-file.js'

function createInput() {
  return createInitialInput({ tagName: 'my-tag' })
}

describe('Generators - javascript', () => {
  it('compile a simple javascript code', () => {
    const { javascript } = parser().parse(simpleJS).output

    const ast = compileJavascript(
      javascript,
      simpleJS,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
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
    const ast = compileJavascript(
      javascript,
      rootThisExpressions,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(output.default.exports).to.be.ok
    expect(output.default.exports().name).to.be.equal('hello')
    expect(output.default.exports().returnNameToUppercase()).to.be.equal(
      'HELLO',
    )
    expect(output.default.exports().method).to.be.a('function')
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('Mixed Exports are not allowed', () => {
    const { javascript } = parser().parse(mixedExport).output
    expect(() =>
      compileJavascript(
        javascript,
        mixedExport,
        {
          options: {
            file: FAKE_FILE,
          },
        },
        createInput(),
      ),
    ).to.throw(
      'You can\t use "export default {}" and root this statements in the same component',
    )
  })

  it('Named export without export default {} should be supported', () => {
    const { javascript } = parser().parse(onlyNamedExport).output
    const ast = compileJavascript(
      javascript,
      onlyNamedExport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(output.hello).to.be.equal('hello')
  })

  it('The this context can be remapped', () => {
    const { javascript } = parser().parse(simpleContextMapping).output
    const ast = compileJavascript(
      javascript,
      simpleContextMapping,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)
    const output = evaluateScript(code)

    expect(code).to.be.a('string')
    expect(output.default.exports).to.be.ok
    expect(output.default.exports().name).to.be.equal('hello')
    expect(output.default.css).to.be.not.ok
    expect(output.default.template).to.be.not.ok
  })

  it('Component interface export can be detected and transformed', () => {
    const { javascript } = parser().parse(interfacesExport).output
    const ast = compileJavascript(
      javascript,
      interfacesExport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.contain(
      "import { withTypes, RiotComponent, RiotComponentWrapper } from 'riot'",
    )
    expect(code).to.contain('} as RiotComponentWrapper<ComponentInterface>;')
  })

  it('Component type export can be detected and transformed', () => {
    const { javascript } = parser().parse(typesExport).output
    const ast = compileJavascript(
      javascript,
      typesExport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.contain(
      "import { withTypes, RiotComponent, RiotComponentWrapper } from 'riot'",
    )
    expect(code).to.contain('} as RiotComponentWrapper<ComponentInterface>;')
  })

  it('Component interface export can be detected and transformed', () => {
    const { javascript } = parser().parse(
      interfacesExportWithoutRiotImport,
    ).output
    const ast = compileJavascript(
      javascript,
      interfacesExportWithoutRiotImport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.contain('import { RiotComponentWrapper } from "riot"')
    expect(code).to.contain('} as RiotComponentWrapper<ComponentInterface>;')
  })

  it('Component type export can be detected and transformed', () => {
    const { javascript } = parser().parse(typesExportWithoutRiotImport).output
    const ast = compileJavascript(
      javascript,
      typesExportWithoutRiotImport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.contain('import { RiotComponentWrapper } from "riot"')
    expect(code).to.contain('} as RiotComponentWrapper<ComponentInterface>;')
  })

  it('Component alias type export can be detected and transformed', () => {
    const { javascript } = parser().parse(
      typesAliasExportWithoutRiotImport,
    ).output
    const ast = compileJavascript(
      javascript,
      typesAliasExportWithoutRiotImport,
      {
        options: {
          file: FAKE_FILE,
        },
      },
      createInput(),
    )
    const { code } = print(ast)

    expect(code).to.be.a('string')

    expect(code).to.contain('import { RiotComponentWrapper } from "riot"')
    expect(code).to.contain('} as RiotComponentWrapper<ComponentInterface>;')
  })
})
