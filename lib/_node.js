/* riot-compiler WIP, @license MIT, (c) 2015 Muut Inc. + contributors */
'use strict'

//#include_once parsers

//#include_once brackets

/**
 * @module compiler
 */
//#include_once core

module.exports = {
  compile: compile,
  html: compileHTML,
  style: _compileCSS,
  css: compileCSS,
  js: compileJS,
  parsers: parsers,
  version: 'WIP'
}
