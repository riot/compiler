/**
 * Simple clone deep function, do not use it for classes or recursive objects!
 * @param   {unknown} source - possibily an object to clone
 * @returns {unknown} the object we wanted to clone
 */
export default function cloneDeep(source) {
  return JSON.parse(JSON.stringify(source))
}
