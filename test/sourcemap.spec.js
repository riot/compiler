import {SourceMapConsumer} from 'source-map'
import {compile} from '../src'
import {expect} from 'chai'
import {getFixture} from './helpers'
import getLineAndColumnByPosition from '../src/utils/get-line-and-column-by-position'

const getLines = source => source.split('\n')

function getSourceByOutputPositions(source, positions) {
  const lines = getLines(source)

  return positions.reduce((string, {column, line}) => {
    return `${string}${lines[line - 1].charAt(column)}`
  }, '')
}

function getGeneatedPositions(sourcemapConsumer, source, positions) {
  return positions.map(position => sourcemapConsumer.generatedPositionFor({...position, source}))
}

function getSourceByPosition(source, line, start, end) {
  return getLines(source)[line - 1].slice(start, end + 1)
}

describe('Column and line position helpers', () => {
  it('Column and line get properly calculated for a simple string', () => {
    const {column, line} = getLineAndColumnByPosition('foo', 0)

    expect(column).to.be.equal(0)
    expect(line).to.be.equal(1)
  })

  it('Column and line get properly calculated for a simple tag', () => {
    const {column, line} = getLineAndColumnByPosition(`<foo>

      <p>Hello</p>
      <p>There</p>
    </foo>`, 13)

    expect(column).to.be.equal(6)
    expect(line).to.be.equal(3)
  })
})

describe('Sourcemap specs', () => {
  it('Sourcemaps should contain only one source', async function() {
    const source = getFixture('my-component.riot')
    const {map} = await compile(source, {
      file: 'my-component.riot'
    })

    expect(map.sources).to.have.length(1)
  })

  it('Sourcemaps contain info about css, javascript and template', async function() {
    const source = getFixture('my-component.riot')
    const result = await compile(source, {
      file: 'my-component.riot'
    })
    const output = result.code
    const sourcemapConsumer = await new SourceMapConsumer(result.map)

    expect(sourcemapConsumer.sourceContentFor('my-component.riot')).to.be.ok

    // in the js part
    // const
    expect(getSourceByPosition(source, 15, 4, 8)).to.be.equal(
      getSourceByOutputPositions(output,
        getGeneatedPositions(sourcemapConsumer, 'my-component.riot', [
          {line: 15, column: 4},
          {line: 15, column: 5},
          {line: 15, column: 6},
          {line: 15, column: 7},
          {line: 15, column: 8}
        ])
      )
    )

    // in the template
    // value
    expect(getSourceByPosition(source, 5, 58, 62)).to.be.equal(
      getSourceByOutputPositions(output,
        getGeneatedPositions(sourcemapConsumer, 'my-component.riot', [
          {line: 5, column: 58},
          {line: 5, column: 59},
          {line: 5, column: 60},
          {line: 5, column: 61},
          {line: 5, column: 62}
        ])
      )
    )

    // bar
    expect(getSourceByPosition(source, 9, 34, 36)).to.be.equal(
      getSourceByOutputPositions(output,
        getGeneatedPositions(sourcemapConsumer, 'my-component.riot', [
          {line: 9, column: 34},
          {line: 9, column: 35},
          {line: 9, column: 36}
        ])
      )
    )

    sourcemapConsumer.destroy()
  })
})