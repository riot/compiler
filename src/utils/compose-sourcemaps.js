import isNode from './is-node'
import recastUtil from 'recast/lib/util'

/**
 * Return a source map as JSON, it it has not the toJSON method it means it can
 * be used right the way
 * @param   { SourceMapGenerator|Object } map - a sourcemap generator or simply an json object
 * @returns { Object } the source map as JSON
 */
function asJSON(map) {
  if (map.toJSON) return map.toJSON()
  return map
}
/**
 * Compose two sourcemaps
 * @param   { SourceMapGenerator } formerMap - original sourcemap
 * @param   { SourceMapGenerator } latterMap - target sourcemap
 * @returns { Object } sourcemap json
 */
export default function composeSourcemaps(formerMap, latterMap) {
  if (
    isNode() &&
    formerMap && latterMap && latterMap.mappings
  ) {
    return recastUtil.composeSourceMaps(asJSON(formerMap), asJSON(latterMap))
  } else if (isNode() && formerMap) {
    return asJSON(formerMap)
  }

  return {}
}