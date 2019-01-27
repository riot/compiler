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
 * @param   { Object } options - user options, probably containing the path to the source file
 * @returns { Output } output container object
 */
export function createOutput(data, options) {
  const output = Object.seal({
    ...Output,
    ...data,
    meta: { options }
  })

  if (!output.map && options && options.file) Object.assign(output, {
    map: createSourcemap({ file: options.file })
  })

  return output
}

/**
 * Transform the source code received via a compiler function
 * @param   { Function } compiler - function needed to generate the output code
 * @param   { Object } options - options to pass to the compilert
 * @param   { string } source - source code
 * @returns { Promise<Output> } output - the result of the compiler
 */
export async function transform(compiler, options, source) {
  const result = await (compiler ? compiler(source, options) : { code: source })
  return createOutput(result, options)
}