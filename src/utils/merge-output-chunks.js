import composeSourcemaps from './compose-sourcemaps'

/**
 * Combine two code chunks into one single output object
 * @param   { Output } chunk1 - chunk of code containing code and map as keys
 * @param   { Output } chunk2 - chunk of code containing code and map as keys
 * @returns { Output } the two code chunks merged
 */
export default function mergeOutputChunks(chunk1, chunk2) {
  return {
    code: chunk1.code + chunk2.code,
    map: composeSourcemaps(chunk1.map, chunk2.map)
  }
}