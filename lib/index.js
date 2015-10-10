//#if RIOT_CLI
/* riot-compiler v2.3.0, @license MIT, (c) 2015 Muut Inc. + contributors */

/* istanbul ignore next */
;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['riot-tmpl'], factory)
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('riot-tmpl'))
  }
  else {
    root.compiler = factory(root.riot.util.tmpl)
  }

})(this, function (_tmpl) {
  var
    brackets = _tmpl.brackets,
    regEx = _tmpl.regEx

//#endif


  //#include_once parsers
  //#include_once core
  //#include_once browser


//#if RIOT_CLI

  return {
    compile: function(src, opts, url) {
      opts.whitespace = true
      return compile(src, opts, url)
    },
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers,
    loadAndCompile: loadAndCompile
  }
})

//#endif
