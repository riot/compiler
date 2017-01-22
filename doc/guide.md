# Compiler Guide (complement, WIP)

Please note the compiler generates code for call to the internal function `riot.tag2`, which is a simplified version of `riot.tag`. Since the type and order of the parameters of `riot.tag2` can change in any moment, we are using the `riot.tag` here for illustration purposes.

## Indentation

From v2.3.13, the compiler handles a more consistent and flexible indentation in both inline and external tag definitions.
The opening tag must begin a line. You can use any tabs or spaces you want. The compiler uses this to find the closing tag and unindent the content, so the closing tag must have _exactly_ the same indentation of the opening tag.

HTML comments and trailing whitespace are removed from the entire tag content, JavaScript comments are removed from the JavaScript block only. You should not use comments in expressions.

Inside `<pre>` tags, linefeeds are preserved.

Example:
```html
// This JS comment is at column 0, out of the tag
  <treeitem>      <!-- the openning tag is indentent by 2 spaces -->
    <pre>one      <!-- here in the html block you can't use... -->
    two</pre>     <!-- ...JavaScript comments -->
    <treeitem>    <!-- this nested tag is indented by 4 spaces... -->
    </treeitem>   <!-- ...so the compiler ignore it -->
    click(e) {}   <!-- JavaScript code is indented by 4 spaces -->
  </treeitem>     // the closing tag is indented by 2 spaces, this comment must be JS
```

generates:
```js
// This JS comment is at column 0, out of the tag
riot.tag('treeitem', '<pre>one\n  two\n</pre> <treeitem> </treeitem>', function(opts) {
  this.click = function(e) {}.bind(this)
});     // the closing tag is indented by 2 spaces, this comment must be JS
```

Note the `<pre>` content, this is unindented by 2 too.


### One-line Tags

Riot can handle one-line tag definitions like this:

```html
<oneline attrib="x"/>
```

or this:
```html
<oneline attrib="x"><p><!-- --></p></oneline>
```

As multiline tags, these can be indentent by any tabs or spaces, but can not contain `style`/`script` tags nor untagged JavaScript code, only html markup.

### Untagged HTML Content

From the Riot Guide:

> Without the `<script>` tag the JavaScript starts where the last HTML tag ends.

If there's no HTML tags within the root tag, riot assumes that the content is JavaScript, so the following does not work:
```html
<my-tag>
  I'm html?
</my-tag>
```

This may seem counterintuitive, but complies with the riot specification for [untagged JavaScript blocks](#the-untagged-javascript-block).

In the above case, you can use this:
```html
<my-tag>I'm html</my-tag>
```

But there's other cases...
```html
<my-title>
  {title}
  this.title = 'Title'
<my-title>
```

Here, the compiler cannot guess if `{title}` is an expression or a literal ES6 object.

However, from v2.5.4 you can use the BuGless-hack...
```html
<my-title>
  {title}<-/>
  this.title = 'Title'
</my-title>
```

The ending `<-/>` puts `{title}` as expression in the html part and the `<-/>` is removed.

### Whitespace

In the html, including quoted text, newlines are converted to spaces and compacted (successive empty lines are merged into one), except if you pass the `whitespace` option to the compiler, in which case only takes place normalization to Unix-style line endings.

The following table summarizes this behavior with [different options](#compilation-options):

| example | generates | options
| ------- | --------- | -------
| `<p>\r<p>\n<p> </p>` | `<p> </p> <p> </p>`     | (none)
| `<p>\r<p>\n<p> </p>` | `<p>\\n</p>\\n<p> </p>` | `whitespace:true`
| `<p>\r<p>\n<p> </p>` | `<p></p><p></p>`        | `compact:true`
| `<p>\r<p>\n<p> </p>` | `<p>\\n</p>\\n<p></p>`  | `compact:true, whitespace:true`

**In other parts**

Tag attributes, including these within nested tags, are normalized. This is:
* the attribute name is converted to lowercase
* newlines are converted to compacted spaces
* spacing between name and value is removed
* the value is enclosed in double quotes

Content of `style` blocks and expressions are trimmed and newlines converted to compacted spaces.

This example shows the behavior with the default options on different parts of a tag:
```html
<my-tag
  style='
    top:0;
    left:0' expr={
      { foo:"bar" }
      }>
  <style>
   p {
     display: none;
   }
  </style>
  <p/>
  click(e)
  {}
</my-tag>
```

will generate this:
```js
riot.tag('my-tag', '<p></p>', 'p { display: none; }', 'style=" top:0; left:0" expr="{{ foo:"bar" }}"', function(opts) {
  this.click = function(e)
  {}.bind(this)
});
```

**NOTE:** No matter which options you use, newlines are normalized to `\n` and comments and trailing spaces are removed before the parsing begins.

### Brackets and Backslashes

From the perspective of the riot compiler, backslashes in the template are characters with no special meaning.
The compiler preserves them with one exception: backslashes inside expressions used to escape riot brackets are removed. This occurs just before the expression is passed to any JS parser.

Actually, with correct JavaScript, the compiler is a bit smarter and does not need escaped brackets _within_ expressions.
However, it is needed for literal opening brackets in the html, out of expressions, since there is no way to differentiate literal brackets from riot brackets.

Example with the default brackets:
```html
<my-tag non-expr="\{ empty:\{} }" expr="{ empty:{} }"></my-tag>
```

In the first, non-expression attribute, opening brackets must be escaped.

The generated code is:
```js
riot.tag('my-tag', '', '', 'non-expr="\\{ empty:\\{} }" expr="{empty:{}}"', function(opts) {
});
```
at runtime, the backslashes in `non-expr` will be removed. If you need output a literal backslash in front of brackets, you must use `\\{` to generate `\\\\{`.

## Compiler Options

The `compile` and `riot.compile` functions can take an additional parameter specifing various settings. This is a plain JavaScript object with one or more of following options as properties.

| option      | module  | type    | description |
| ----------- |:------: |:------: | ----------- |
| brackets    | html    | string  | Change brackets used for expressions. Defaults to `{ }` in the server, current custom brackets in the browser
| expr        | html    | boolean | Run expressions through the parser defined with the `type` option
| compact     | html    | boolean | Remove spaces between tags (minify `<p> </p> <p> </p>` to `<p></p><p></p>`)
| whitespace  | html    | boolean | Preserve newlines and tabs. newlines are normalized anyway
| template    | html    | string  | HTML pre-processor. Built-in support for: jade
| type        | js      | string  | JavaScript pre-processor. Built-in support for: es6, buble, coffeescript, typescript, livescript, none (no preprocess)
| style       | css     | string  | CSS pre-processor. Built-in support for: sass, scss, less, stylus (only less in browsers)
| entities    | compile | boolean | Split the tag in its raw parts.
| exclude     | compile | array   | This is an array of strings with part names to exclude. These names are the same as those generated by the `entities` option: html, css, attribs, js. Ej. `{exclude: ['js']}`

### The `entities` Option

This option, new in v2.3.13, causes the `compile` function return an array of objects with the parts of the tags.
Each object contains five properties: tagName, html, attribs, css, and js. Propertie values for non-existent parts are empty strings.

From v2.5.4, `entities` includes the `import` declarations as a multiline string.

Example:
```html
<script type="riot/tag" id="test1">
  // two custom tags
  <tag1 id="id1"><div/></tag1>
  <tag2>
    <style>#id1 {top:0}</style>
    <p/>
    import * as foo from "./module"
    click(e) {
    }
  </tag2>
</script>

<script>
  var arr = compiler.compile(document.getElementById('test1').innerHTML, {entities: true})
</script>
```
will set `arr` to be:
```js
[
  {tagName: 'tag1', html: '<div></div>', css: '', attribs: 'id="id1"', js: ''},
  {tagName: 'tag2', html: '<p></p>', css: '#id1 {top:0}', attribs: '', js: '  this.click = function(e) {\n  }.bind(this);', imports: 'import * as foo from "./module"\n' }
]
```

Be aware that the `html` and `js` properties can contain raw line endings --i.e. unescaped `\r` and `\n`.


## Parser Options

In addition to the `type` attribute, the `script` and `style` tags can include additional configuration at tag level through the `options` attribute.

This attribute is a [JSON](http://json.org/) object that specifies options for the JS or CSS parser.

Example:
```html
<my-tag>
  <style type='myCSSparser' options='{"option": true}'>
    p {color: "red"}
  </style>
  <p>Red</p>

  <script type="myJSparser" options='{"option": "yes"}'>
    this.clock = function (e) {}.bind(this)
  </script>
</my-tag>
```

**Note:** The `options` attribute must comply with the [JSON specs](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf), i.e. with double-quoted property names and strings, in a format suitable for `JSON.parse`


## JavaScript

Where the html ends? or where should I put my JavaScript?

### The Untagged JavaScript Block

The first action taken by the compiler is send the received source to any html parser.
After that, the compiler normalizes line endings to `\n`.
This is done in the entire source.

Once prepared the source, searches the html elements. For each found element separates its parts (closing/opening tag, root attributes, and content) and parses the root attributes, then removes _html_ comments and trim trailing whitespace from the content.

Then, one at the time, removes all the `script` blocks and sends its content to the JS parser. Next, it does the same for the `style` blocks.

In the remaining content, looks for the last html tag which _terminate its line_.
If found, this closing tag signals the end of the html markup and the beginning of the untagged JavaScript code.
If not found, all remaining is considered JavaScript.

So, you can put `style` and `script` blocks anywhere in the content, the only restriction is that the untagged JavaScript block must be last and you can't use JavaScript comments outside this block.

**Note:** This freedom has a cost: JavaScript strings containing script or style tags have to be written with tricks as:
```js
<script>
  var js1 = '<script><\/script>'  // tagged JS, you can write '<script>' as-is
</script>
var js2 = '\x3cscript><\/script>' // in untagged block you need another trick
```

### To ES6 Users

Following the above rules, detect the last HTML tag is not difficult, but keep in mind that template strings may break the compiler, as in the following tag:

```html
<mytag>
  // js code
  var s = `
  <p>
  `
</mytag>
```
The compiler does not recognize template strings and confuses `<p>` with the last HTML element.


### ES6 modules

From v2.5.4 the riot-compiler offers limited support for ES6 modules (`import` declarations are hoisted and each must be written in one line).
Also, the `entities` option returns the declarations as one multiline string.

**Note:** An `import` declaration must not spawn multiple lines.

See [Chapter 16 Modules](http://exploringjs.com/es6/ch_modules.html) of Exploring ES6.

### Multiple JavaScript Blocks

Each JavaScript block in the tag can have different `type` attributes.
Once parsed, all blocks will be merged by the compiler.
The resulting block is enclosed in a function, executed at mount time in the tag context, this is why sometimes is referred to as the tag "constructor".

### Loading JavaScript from the File System (v2.3.13)

The `src` attribute of the `script` tags inside a riot tag allows load source files from the file system.

The filename in `src` can be absolute or relative. If you pass a third parameter to the `compile` function with the full name of the file being compiled, relative paths will be resolved from this name, if not, these will be relative to the current working directory (as returned by `proccess.cwd()`).

Without a `type=` directive, the JavaScript parser defaults to the `type` specified in the options passed to the compiler. If you don't want the code to be parsed, use `type="none"`.

If you just want to get the `script` tag rendered, keeping the `type`
attribute and the tag contents untouched, you should then use the `defer`
attribute.

The `defer` attribute is used to avoid the processing of the `script` tag
during the Riot compile time, which would threat them as 'code to be
evaluated'. This will be deferred to happen just on the final renderer context
(e.g. Web Browsers).
This can be useful for example on Server Side Rendering (SSR) of plain
old HTML files. Riot Tags in this context would include some logic inside
`script` tags designed to be run on just on the Client (e.g. To provide
animations). The original `defer` attribute is also removed during the
rendering of the final emitted  `script` tag.

The encoding is specified by the `charset` attribute. It defaults to `utf8`.

Example:
```js
var compile = require('riot-compile'),
    fs = require('fs')
var tagfile = 'src/mytag.tag',
    outfile = 'js/mytag.js',
    options = {}

fs.readFile(tagfile, function (err, source) {
  if (err) throw err
  var js = compiler.compile(source, options, tagfile)
  fs.writeFile(outfile, js)
})
```

So, if you have a js/data.js loaded by a mytag.tag file...
```js
// js/data.js file
const APP_NAME = 'My App'
```

```html
// mytag.tag file
<my-tag>
  <h1>{ title }</h1>
  <script src="js/data.js" type="es6"></script>
  this.title = APP_NAME
</my-tag>
```

the result is equivalent to
```html
<my-tag>
  <h1>{ title }</h1>
  <script type="es6">
  const APP_NAME = 'My App'
  </script>
  this.title = APP_NAME
</my-tag>
```

To avoid the compiler load the code from the file, include the keyword `defer` in the tag:
```html
  <script src="js/data.js" defer></script>
```
with this, the `<script>` is retained in the html, with the keyword `defer` removed.

**Note:** You cannot nest `<script>` elements.

## Style

(WIP)

### Scoped Style

(WIP)

### Utility Functions

There are functions in the node.js build that allow you to compile certain sources:

#### html(source, compilerOptions, expressions)

| parameter | type | description
| --------- | ---- | -----------
| source    | string | html markup, without styles nor JavaScript code
| compilerOptions | object | optional. Used properties: `brackets`, `withespace`, `compact`, `type`, `expr`
| expressions | Array | optional. See below.

The `expressions` parameter is interesting, on return it holds, in order of appearance, trimmed and without brackets, the expressions found in the html. If you set `type` and `expr` in the _compilerOptions_ parameter, the expressions will be compiled.

**Note:** `expressions` is exposed for debugging purposes, but not dependent on it, its format may be altered in future versions.

#### css(source, parserName, extraOptions)

| parameter | type | description
| --------- | ---- | -----------
| source    | string | styles
| parserName   | string | optional, can be omited. Must be one of `parsers.js`
| extraOptions | Object | optional, can be omited. Used properties: `tagName`, `parserOpts`, `url`, and `scoped`

The `tagName`, `url`, and `parserOpts` properties of _extraOptions_ will be passed to the given parser.

Setting the `scoped` property of _extraOptions_ will compile the styles as _Scoped CSS_ after run any parser, `scoped` can't be used without `tagName`.

Example:
```js
var opts = {url: filename, scoped: true, tagName: 'my-tag'},
    css  = compiler.css(styles, 'stylus', opts)
```
will run `parsers.css.stylus(opts.tagName, styles, opts.parserOpts, opts.url)`, then convert the result to Scoped CSS with `my-tag` as root.

#### js(source, compilerOptions, parserName, extraOptions)

| parameter | type | description
| --------- | ---- | -----------
| source    | string | Raw JavaScript code
| compilerOptions | object | Optional. This is **deprecated**, use `parserName`
| parserName   | string | optional. Must be one of `parsers.js`
| extraOptions | Object | optional. Used properties: `parserOpts`, `url`

The `parserOpts` and `url` properties of _extraOptions_ will be passed to the given parser.

Example:
```js
var opts = {url: url},
    css = compiler.js(code, 'buble', opts)
```
will run `parsers.js.buble(code, opts.parserOpts, opts.url)` (inside the parser, the url will be passed as `{source: url}` to bublé).

**Note:**
If you omit `parserName` but include `extraOptions`, you **must** include `compilerOptions` as well:
```js
var js = compiler.js(source, {}, extraOptions)
```
But, since the default JS parser does not make use of the extra options, you can use:
```js
var js = compiler.js(source)
```

The `compilerOptions` parameter will be removed in v2.4
