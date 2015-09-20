
  return {
    compile: compile,
    html: compileHTML,
    style: compileCSS,
    js: compileJS,
    parsers: parsers,
    /*loadAndCompile: loadAndCompile,*/
    tmpl: tmpl // temporal, for perf.js
  }
}));
