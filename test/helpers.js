import {join,relative} from 'path'
import {print} from 'recast'
import {renderSync} from 'node-sass'
import sh from 'shelljs'
import {transformSync} from '@babel/core'

const FIXTURES_DIR = './test/fixtures/'
const EXPECTED_DIR = './test/expected/'
const uid = (() => {
  let i = 0 // eslint-disable-line
  return () => i++
})()

export function getFixture(name) {
  return String(sh.cat(`${FIXTURES_DIR}${name}`))
}

export function getExpected(name) {
  return String(sh.cat(`${EXPECTED_DIR}${name}.js`))
}

export function babelPreprocessor(source, meta) {
  return transformSync(source, {
    sourceMaps: true,
    retainLines: true,
    sourceFileName: meta.options.file,
    presets:   [[
      '@babel/env',
      {
        targets: {
          ie: '11'
        },
        loose: true,
        modules: false,
        useBuiltIns: 'usage'
      }
    ]]
  })
}

export function sassPreprocessor(source, { options }) {
  const result = renderSync({
    file: options.file,
    data: source,
    indentedSyntax: true,
    outFile: options.file,
    sourceMap: true
  })

  return {
    code: String(result.css),
    map: result.map
  }
}

export function evaluateScript(code) {
  const TMP_FILE_NAME = `${uid()}-tmp-file.js`
  const filePath = join(EXPECTED_DIR, TMP_FILE_NAME)
  sh.ShellString(code).to(filePath)

  try {
    const content = require(`./${relative(__dirname, filePath)}`)
    return content
  } catch (error) {
    console.error(error) // eslint-disable-line
    return {}
  } finally {
    sh.rm(filePath)
  }
}

export function renderExpression(ast) {
  return print(ast).code
    .replace('function(_scope) {\n    return', '')
    .replace('return', '')
    .replace(/\}$/, '')
    .replace(/\n/, '')
    .replace(';', '')
    .trim()
}
