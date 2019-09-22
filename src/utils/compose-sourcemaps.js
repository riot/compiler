import asJSON from './sourcemap-as-json'
import {composeSourceMaps} from 'recast/lib/util'
import {isNode} from '@riotjs/util/checks'

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
    return composeSourceMaps(asJSON(formerMap), asJSON(latterMap))
  } else if (isNode() && formerMap) {
    return asJSON(formerMap)
  }

  return {}
}