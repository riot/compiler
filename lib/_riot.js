
//#include_once parsers

riot.parsers = parsers

/**
 * Compiler for riot custom tags
 * @version WIP
 */
var compile = (function () {

  //var brackets = riot.util.brackets

  //#indent 2
  //#include_once core

  riot.util.compiler = {
    compile: compile,
    html: compileHTML,
    css: compileCSS,
    js: compileJS,
    version: 'WIP'
  }
  return compile

})()
