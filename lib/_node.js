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

  //#indent 2

  //#include_once parsers

  var brackets = _tmpl.brackets

  /**
   * @module compiler
   */
  //#include_once core

  return {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers
  }
})
