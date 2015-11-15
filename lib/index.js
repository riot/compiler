//#if NODE
//#undef RIOT
/* riot-compiler WIP, @license MIT, (c) 2015 Muut Inc. + contributors */
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

//#else
//#define RIOT

/**
 * Compiler for riot custom tags
 * @version WIP
 */
//#endif

  //#include_once parsers

  //#if NODE
  //#indent 0
  //#endif

  //#include_once core

//#if NODE

  return {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers
  }
})

//#endif
