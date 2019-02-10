/**
 * True if the sourcemap has no mappings, it is empty
 * @param   {Object}  map - sourcemap json
 * @returns {boolean} true if empty
 */
export default function isEmptySourcemap(map) {
  return !map || !map.mappings || !map.mappings.length
}