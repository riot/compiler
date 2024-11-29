import { isObject } from '@riotjs/util'
import riotParser from '@riotjs/parser'
import hasHTMLOutsideRootNode from './has-html-outside-root-node.js'
import { execute as runPreprocessor } from '../preprocessors.js'

/**
 * Get an object containing the template, css and javascript ast. The origianl source code and the sourcemap are also included
 *
 * @param { string | ParserResult } source - source code of the tag we will need to compile or a parsed Component AST
 * @param { Object } meta - compiler meta object that will be used to store the meta information of the input across the whole compilation
 * @returns { Object } object that will be used to generate the output code
 */
export default function preProcessSource(source, meta) {
  // if the source is a parser output we can return it directly
  // @link https://github.com/riot/compiler/issues/178
  if (isObject(source))
    return { ...source.output, code: source.data, map: null }

  const { options } = meta

  const { code, map } = runPreprocessor(
    'template',
    options.template,
    meta,
    source,
  )

  const parse = riotParser(options).parse
  const { template, css, javascript } = parse(code).output

  // see also https://github.com/riot/compiler/issues/130
  if (hasHTMLOutsideRootNode(template || css || javascript, source, parse)) {
    throw new Error('Multiple HTML root nodes are not supported')
  }

  return { template, css, javascript, map, code }
}
