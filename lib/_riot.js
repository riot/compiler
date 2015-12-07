
//#include_once parsers

riot.parsers = parsers

/**
 * Compiler for riot custom tags
 * @version WIP
 */
var compile = (function () {

  //var brackets = riot.util.brackets

  //#include_once core

  riot.util.compiler = {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS
  }
  return compile

})()
