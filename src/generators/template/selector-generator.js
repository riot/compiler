/**
 * Generate a selector that will be used to handle the DOM bindings
 * @param   { number } i - initial seeder value
 * @returns { string } unique selector attribute
 */
export default (function selectorGenerator(i = 0) {
  return function() {
    return `expr${i++}`
  }
}())