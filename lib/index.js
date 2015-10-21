//#if NODE
//#undef RIOT
/* riot-compiler 2.3.0-beta.3, @license MIT, (c) 2015 Muut Inc. + contributors */
;(function (root, factory) {

  /* istanbul ignore else */
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('riot-tmpl'))
  }
  else if (typeof define === 'function' && define.amd) {
    define(['riot-tmpl'], factory)
  }
  else if (root) {
    root.compiler = factory(root.riot.util)
  }

})(this, function (_tmpl) {
  'use strict'  // eslint-disable-line

  var brackets = _tmpl.brackets

//#else
//#define RIOT

/**
 * Compiler for riot custom tags
 * @version 2.3.0-beta.3
 */
//#endif


  //#include_once parsers

  //#include_once core


//#if RIOT

  //#include_once browser

//#else

  return {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers
  }
})

//#endif
