/* riot-compiler WIP, @license MIT, (c) 2015 Muut Inc. + contributors */
'use strict'  // eslint-disable-line

//#indent 2
//#include_once parsers
//#indent 0

var brackets = require('riot-tmpl').brackets

/**
 * @module compiler
 */
//#include_once core

module.exports = {
  compile: compile,
  html: compileHTML,
  style: compileCSS,
  js: compileJS,
  parsers: parsers
}
