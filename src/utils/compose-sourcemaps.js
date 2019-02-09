import asJSON from './sourcemap-as-json'
import isNode from './is-node'
import recastUtil from 'recast/lib/util'

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