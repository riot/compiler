/* eslint-disable */
/**
 * Simple clone deep function, do not use it for classes or recursive objects!
 * @param   {*} source - possibily an object to clone
 * @returns {*} the object we wanted to clone
 */
export default function cloneDeep(source) {
  if (typeof source !== 'object' || source == null) {
    return source
  }

  const isArray = Array.isArray(source)
  const clone = isArray ? [...source] : { ...source }

  let key

  for (key in clone) {
    if (clone.hasOwnProperty(key)) {
      clone[key] = cloneDeep(clone[key])
    }
  }

  return clone
}
