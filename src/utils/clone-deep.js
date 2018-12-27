/**
 * Simple clone deep function, do not use it for classes or recursive objects!
 * @param   {*} source - possibily an object to clone
 * @returns {*} the object we wanted to clone
 */
export default function cloneDeep(source) {
  return JSON.parse(JSON.stringify(source))
}