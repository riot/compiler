
//#include_once parsers

//#if RIOT
riot.parsers = parsers
//#endif

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
    style: compileCSS,
    js: compileJS
  }
  return compile

})()
