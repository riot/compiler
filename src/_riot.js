//#define RIOT
//#if 0
/*global riot, parsers, compileHTML, compileCSS, compileJS */
//#endif

//#include_once safe-regex
//#include_once parsers_br

riot.parsers = parsers

/**
 * Compiler for riot custom tags
 * @version WIP
 */
var compile = (function () {

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
