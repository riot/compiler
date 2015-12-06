/**
 * Compiler for riot custom tags
 * @version WIP
 */
export default (function () {

  import brackets from 'riot-tmpl'

  //#indent 2
  //#include parsers
  //#indent 0

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
