
/*
  riot-compiler
*/
;(function(window, undefined) {
  * istanbul ignore next */
  // support CommonJS, AMD & browser
  if (typeof exports === 'object')
    module.exports = compiler
  else if (typeof define === 'function' && define.amd)
    define(function() { return compiler })
  else
    window.compiler = compiler

})(typeof window != 'undefined' ? window : undefined);
