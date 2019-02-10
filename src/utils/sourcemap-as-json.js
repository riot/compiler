/**
 * Return a source map as JSON, it it has not the toJSON method it means it can
 * be used right the way
 * @param   { SourceMapGenerator|Object } map - a sourcemap generator or simply an json object
 * @returns { Object } the source map as JSON
 */
export default function sourcemapAsJSON(map) {
  if (map && map.toJSON) return map.toJSON()
  return map
}