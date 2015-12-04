/**
 * Compiler for riot custom tags
 * @version WIP
 */
export default (function () {
  //#indent 2

  import brackets from 'riot-tmpl'

  //#include parsers

  /**
   * @module compiler
   */
  //#include core.js

  return {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers
  }

})()
