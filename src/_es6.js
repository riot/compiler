/**
 * Compiler for riot custom tags
 * @version WIP
 */
//#if 0
/*eslint-env es6 */
/*global compile, compileHTML, compileCSS, compileJS, parsers */
/*eslint no-unused-vars: [2, {args: "after-used", varsIgnorePattern: "^brackets$"}] */
//#endif

import { brackets } from 'riot-tmpl'

//#include safe-regex

//#include parsers_br

/**
 * @module compiler
 */
//#include core.js

var version = 'WIP'

export default {
  compile,
  compileHTML,
  compileCSS,
  compileJS,
  parsers,
  version
}
