import isNode from './is-node'
import recastUtil from 'recast/lib/util'
/**
 * Compose two sourcemaps
 * @param   { SourceMapGenerator } formerMap - original sourcemap
 * @param   { SourceMapGenerator } latterMap - target sourcemap
 * @returns { Object } sourcemap json
 */
export default function composeSourcemaps(formerMap, latterMap) {
  if (isNode()) {
    if (formerMap && latterMap && latterMap.mappings) {
      return recastUtil.composeSourceMaps(formerMap.toJSON(), latterMap.toJSON())
    }

    if (formerMap) {
      return formerMap.toJSON()
    }
  }

  return {}
}