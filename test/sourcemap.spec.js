import { babelPreprocessor, getFixture } from './helpers.js'
import { register, unregister } from '../src/preprocessors.js'
import { SourceMapConsumer } from 'source-map'
import { compile } from '../src/index.js'
import { expect } from 'chai'
import getLineAndColumnByPosition from '../src/utils/get-line-and-column-by-position.js'

const getLines = (source) => source.split('\n')

function getSourceByOutputPositions(source, positions) {
  const lines = getLines(source)

  return positions.reduce((string, { column, line }) => {
    return `${string}${lines[line - 1].charAt(column)}`
  }, '')
}

function getGeneratedPositions(sourcemapConsumer, source, positions) {
  return positions.map((position) =>
    sourcemapConsumer.generatedPositionFor({ ...position, source }),
  )
}

function getSourceByPosition(source, line, start, end) {
  return getLines(source)[line - 1].slice(start, end + 1)
}

describe('Column and line position helpers', () => {
  it('Column and line get properly calculated for a simple string', () => {
    const { column, line } = getLineAndColumnByPosition('foo', 0)

    expect(column).to.be.equal(0)
    expect(line).to.be.equal(1)
  })

  it('Column and line get properly calculated for a simple tag', () => {
    const { column, line } = getLineAndColumnByPosition(
      `<foo>

      <p>Hello</p>
      <p>There</p>
    </foo>`,
      13,
    )

    expect(column).to.be.equal(6)
    expect(line).to.be.equal(3)
  })
})

describe('Sourcemap specs', () => {
  it('Sourcemaps should contain only one source', () => {
    const source = getFixture('my-component.riot')
    const { map } = compile(source, {
      file: 'my-component.riot',
    })

    expect(map.sources).to.have.length(1)
    expect(map.sourcesContent[0]).to.be.equal(source)
  })

  it('Sourcemaps contain info about css, javascript and template', async function () {
    const source = getFixture('my-component.riot')
    const result = compile(source, {
      file: 'my-component.riot',
    })
    const output = result.code
    const sourcemapConsumer = await new SourceMapConsumer(result.map)

    expect(sourcemapConsumer.sourceContentFor('my-component.riot')).to.be.ok

    // in the js part
    // const
    expect(getSourceByPosition(source, 19, 4, 8)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-component.riot', [
          { line: 19, column: 4 },
          { line: 19, column: 5 },
          { line: 19, column: 6 },
          { line: 19, column: 7 },
          { line: 19, column: 8 },
        ]),
      ),
    )

    // in the template
    // value
    expect(getSourceByPosition(source, 5, 58, 62)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-component.riot', [
          { line: 5, column: 58 },
          { line: 5, column: 59 },
          { line: 5, column: 60 },
          { line: 5, column: 61 },
          { line: 5, column: 62 },
        ]),
      ),
    )

    // bar
    expect(getSourceByPosition(source, 13, 34, 36)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-component.riot', [
          { line: 13, column: 34 },
          { line: 13, column: 35 },
          { line: 13, column: 36 },
        ]),
      ),
    )

    // baz

    expect(getSourceByPosition(source, 9, 9, 11)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-component.riot', [
          { line: 10, column: 9 },
          { line: 10, column: 10 },
          { line: 10, column: 11 },
        ]),
      ),
    )

    sourcemapConsumer.destroy()
  })

  it('Sourcemaps work also with preprocessors', async function () {
    register('javascript', 'babel', babelPreprocessor)

    const source = getFixture('my-babel-component.riot')
    const result = compile(source, {
      file: 'my-babel-component.riot',
    })
    const output = result.code
    const sourcemapConsumer = await new SourceMapConsumer(result.map)

    expect(sourcemapConsumer.sourceContentFor('my-babel-component.riot')).to.be
      .ok

    // in the js part
    // const
    expect(getSourceByPosition(source, 19, 4, 8)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-babel-component.riot', [
          { line: 19, column: 4 },
          { line: 19, column: 5 },
          { line: 19, column: 6 },
          { line: 19, column: 7 },
          { line: 19, column: 8 },
        ]),
      ),
    )

    // in the template
    // value
    expect(getSourceByPosition(source, 5, 58, 62)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-babel-component.riot', [
          { line: 5, column: 58 },
          { line: 5, column: 59 },
          { line: 5, column: 60 },
          { line: 5, column: 61 },
          { line: 5, column: 62 },
        ]),
      ),
    )

    // bar
    expect(getSourceByPosition(source, 13, 34, 36)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-babel-component.riot', [
          { line: 13, column: 34 },
          { line: 13, column: 35 },
          { line: 13, column: 36 },
        ]),
      ),
    )

    // baz

    expect(getSourceByPosition(source, 9, 9, 11)).to.be.equal(
      getSourceByOutputPositions(
        output,
        getGeneratedPositions(sourcemapConsumer, 'my-babel-component.riot', [
          { line: 10, column: 9 },
          { line: 10, column: 10 },
          { line: 10, column: 11 },
        ]),
      ),
    )

    sourcemapConsumer.destroy()

    unregister('javascript', 'babel')
  })
})
