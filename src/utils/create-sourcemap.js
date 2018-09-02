import { SourceMapGenerator } from 'source-map'

/**
 * Create a new sourcemap generator
 * @param   { Object } options - sourcemap options
 * @returns { SourceMapGenerator } SourceMapGenerator instance
 */
export default function createSourcemap(options) {
  return new SourceMapGenerator(options)
}