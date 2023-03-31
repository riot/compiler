/**
 * Ckeck if an Array-like object has empty length
 * @param {Array} target - Array-like object
 * @returns {boolean} target is empty or null
 */
export default function isEmptyArray(target) {
  return !target || !target.length
}
