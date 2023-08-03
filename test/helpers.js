import { join, relative, dirname } from 'path'

import * as sass from 'sass'
import sh from 'shelljs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { transformSync } from '@babel/core'
import generateJavascript from '../src/utils/generate-javascript.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { compileString } = sass
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
    presets: [
      [
        '@babel/env',
        {
          targets: {
            ie: '11',
          },
          loose: true,
          modules: 'commonjs',
          useBuiltIns: false,
        },
      ],
    ],
  })
}

export function sassPreprocessor(source) {
  const result = compileString(source, {
    syntax: 'indented',
    sourceMap: true,
  })

  return {
    code: result.css,
    map: result.sourceMap,
  }
}

export function evaluateScript(code) {
  const TMP_FILE_NAME = `${uid()}-tmp-file.cjs`
  const filePath = join(EXPECTED_DIR, TMP_FILE_NAME)
  sh.ShellString(
    babelPreprocessor(code, {
      options: {
        file: TMP_FILE_NAME,
      },
    }).code,
  ).to(filePath)

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

// recast might generate weird strings
// this transformation simplifies the readability of the unit test
export function renderExpression(ast) {
  return generateJavascript(ast)
    .code.replace('_scope => ', '')
    .replace(/\n/g, '')
    .replace(/([([])\s+/g, '$1')
    .replace(/,\s+/g, ', ')
    .replace(/\((class[\s\S]+)\)/g, '$1')
    .replace(';', '')
    .trim()
}
