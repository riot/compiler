
var loadAndCompile = (function () {

  var doc = typeof window !== 'undefined' ? window.document : null,
      promise,
      ready

  function GET(url, fn) {
    var req = new XMLHttpRequest()

    req.onreadystatechange = function () {
      if (req.readyState == 4 &&
        (req.status == 200 || !req.status && req.responseText.length))
        fn(req.responseText, url)
    }
    req.open('GET', url, true)
    req.send('')
  }

  function unindent(src) {
    var ident = src.match(/^[ \t]+/)
    if (ident) src = src.replace(new RegExp('^' + ident[0], 'gm'), '')
    return src
  }

  function globalEval(js) {
    var
      node = doc.createElement('script'),
      root = doc.documentElement

    node.text = js
    root.appendChild(node)
    root.removeChild(node)
  }

  function compileScripts(fn) {
    var
      scripts = doc.querySelectorAll('script[type="riot/tag"]'),
      scriptsAmount = scripts.length

    function done() {
      promise.trigger('ready')
      ready = true
      if (fn) fn()
    }

    function compileTag(source, url) {
      globalEval(compile(source, url))
      if (!--scriptsAmount) done()
    }

    if (scriptsAmount) {
      [].forEach.call(scripts, function (script) {
        var url = script.getAttribute('src')
        url ? GET(url, compileTag) : compileTag(script.innerHTML, url)
      })
    }
    else done()
  }

  return function _loadAndCompile(arg, fn) {

    if (typeof arg === 'string') {

      if (arg.trim()[0] === '<') {
        /*
          riot.compile(tag [, true])
          Compiles and, if true is missing, executes the given tag. If true is given,
          returns the tag as a string. Only the transformation from the tag to JS is
          performed and the tag is not executed on the browser.
        */
        var js = unindent(compile(arg))
        if (!fn) globalEval(js)         // fn is true or undefined
        return js

      } else {
        /*
          riot.compile(url [, callback])
          Loads the given URL and compiles all tags after which the callback is called.
        */
        return GET(arg, function (str, url) {
          var js = unindent(compile(str, url))
          globalEval(js)
          if (fn) fn(js, str)
        })
      }
    }

    /*
      riot.compile([callback])
      Compile all tags defined with <script type="riot/tag"> to JavaScript.
      These can be inlined script definitions or external resources that load scripts
      defined with src attribute.
      After all scripts are compiled the given callback method is called.
    */
    fn = typeof arg !== 'function' ? undefined : arg

    // all compiled
    if (ready)
      return fn && fn()

    // add to queue
    if (promise) {
      if (fn)
        promise.on('ready', fn)

    // grab riot/tag elements + load & execute them
    } else {
      promise = riot.observable()
      compileScripts(fn)
    }
  }

})()
