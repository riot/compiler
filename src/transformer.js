import createSourcemap from './utils/create-sourcemap'

export const Output = Object.freeze({
  code: '',
  ast: [],
  meta: {},
  map: null
})

/**
 * Create the right output data result of a parsing
 * @param   { Object } data - output data
 * @param   { string } data.code - code generated
 * @param   { AST } data.ast - ast representing the code
 * @param   { SourceMapGenerator } data.map - source map generated along with the code
 * @param   { Object } meta - compilation meta infomration
 * @returns { Output } output container object
 */
export function createOutput(data, meta) {
  const output = {
    ...Output,
    ...data,
    meta
  }

  if (!output.map && meta && meta.options && meta.options.file)
    return {
      ...output,
      map: createSourcemap({ file: meta.options.file })
    }

  return output
}

/**
 * Transform the source code received via a compiler function
 * @param   { Function } compiler - function needed to generate the output code
 * @param   { Object } meta - compilation meta information
 * @param   { string } source - source code
 * @returns { Output } output - the result of the compiler
 */
export function transform(compiler, meta, source) {
  const result = (compiler ? compiler(source, meta) : { code: source })
  return createOutput(result, meta)
}