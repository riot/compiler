import isEmptyArray from './is-empty-array.js'

/**
 * True if the sourcemap has no mappings, it is empty
 * @param   {Object}  map - sourcemap json
 * @returns {boolean} true if empty
 */
export default function isEmptySourcemap(map) {
  return !map || isEmptyArray(map.mappings)
}
