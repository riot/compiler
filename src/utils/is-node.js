/**
 * Detect node js environements
 * @returns { boolean } true if the runtime is node
 */
export default function isNode() {
  return typeof process !== 'undefined'
}