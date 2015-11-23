# Compiler Guide (complement, WIP)

## Indentation

From v2.3.13, the compiler handles a more consistent and flexible indentation in both inline and external tag definitions.
The opening tag must begin a line. You can use any tabs or spaces you want. The compiler uses this to find the closing tag and unindent the content, so the closing tag must have _exactly_ the same indentation of the opening tag.

HTML comments and trailing whitespace are removed from the entire tag content, JavaScript comments are removed from the JavaScript block only, so you can not use comments in expressions.

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
riot.tag2('treeitem', '<pre>one\n  two\n</pre> <treeitem> </treeitem>', '', '', function(opts) {
  click(e) {}
});     // the closing tag is indented by 2 spaces, this comment must be JS
```

Note the `<pre>` content, this is unindented by 2 too.


### One-line tags

Riot can handle one-line tag definitions like this:

```html
<oleline attrib="x"/>
```

or this:
```html
<oleline attrib="x"><p><!-- --></p></oneline>
```

As multiline tags, these can be indentent by any tabs or spaces, but can not contain `style`/`script` tags nor untagged JavaScript code, only html markup.

### Whitespace

In the html, including quoted text, newlines are converted to spaces and compacted (successive empty lines are merged into one), except if you pass the `whitespace` option to the compiler, in which case only takes place normalization to Unix-style line endings.

The following table summarizes this behavior with [different options](#compilation-options):

| example | generates | options
| ------- | --------- | -------
| `<p>\n<p>\n<p> </p>` | `<p> </p> <p> </p>`     | defaults
| `<p>\n<p>\n<p> </p>` | `<p>\\n</p>\\n<p> </p>` | `whitespace:true`
| `<p>\n<p>\n<p> </p>` | `<p></p><p></p>`        | `compact:true`
| `<p>\n<p>\n<p> </p>` | `<p>\\n</p>\\n<p></p>`  | `compact:true, whitespace:true`

**In other parts**

Tag attributes, including these within nested tags, are normalized. This is, newlines are converted to compacted spaces, spacing between name and value is removed, and the value is enclosed in double quotes.

Content of `style` blocks and expressions are trimmed and newlines converted to compact spaces.

This example shows the behavior with the default options on different parts of a tag:
```html
<my-tag
  style='
    top:0;
    left:0' expr={ {
      foo:"bar" }
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
riot.tag2('my-tag', '<p></p>', 'display: none;', 'style="top:0; left:0" expr={{ foo:"bar" }}', function(opts) {
  this.click = function(e)
  {}.bind(this);
}, '{ }');
```

**NOTE:** No matter which options you use, newlines are normalized to `\n` and html comments and trailing spaces are removed before the parsing begins.

### Brackets and backslashes

From the perspective of the riot compiler, backslashes in the template are characters with no special meaning.
The compiler preserves them with one exception: backslashes inside expressions used to escape riot brackets are removed. This occurs just before the expression is passed to any JS parser.

Actually, with correct JavaScript, the compiler is a bit smarter and does not need escaped brackets _inside_ expressions.
However, it is needed for literal opening brackets out of expressions, since there is no way to differentiate from riot brackets.

Example:
```html
<my-tag non-expr="\{ empty:\{} }" expr="{ empty:{} }"></my-tag>
```

In the first, non-expr attribute, opening brackets must be escaped.
The generated code is:
```js
// This JS comment is at column 0, out of the tag
riot.tag2('my-tag', '', '', 'non-expr="\\{ empty:\\{} }" expr="{empty:{}}"', function(opts) {
  click(e) {}
});     // the closing tag is indented by 2 spaces, this comment must be JS
```
at runtime, the backslashes in `non-expr` will be removed. If you need output a literal backslash in front of brackets, you must use `\\{` to generate `\\\\{`.

## Compilation options

The `compile` and `riot.compile` functions can take an additional parameter specifing various settings. This is a plain JavaScript object with one or more of following options as properties.

| option      | module  | type    | description |
| ----------- |:------: |:------: | ----------- |
| brackets    | html    | string  | Change brackets used for expressions. Defaults to `{ }` in the server, current custom brackets in the browser
| expr        | html    | boolean | Run expressions through the parser defined with the `type` option
| compact     | html    | boolean | Remove spaces between tags (minify `<p> </p> <p> </p>` to `<p></p><p></p>`)
| whitespace  | html    | boolean | Preserve newlines and tabs. newlines are normalized anyway
| template    | html    | string  | HTML pre-processor. Built-in support for: jade
| type        | js      | string  | JavaScript pre-processor. Built-in support for: es6, babel, coffeescript, typescript, livescript, none
| style       | css     | string  | CSS pre-processor. Built-in support for: jade
| entities    | compile | boolean | Split the tag in its raw parts

### The `entities` option

This option, new in v2.3.13, causes the `compile` function return an array of objects with the parts of the tags.

Example:
```html
<script type="riot/tag" id="test1">
  // two custom tags
  <tag1 id="id1"><div/></tag1>
  <tag2>
    <style>#id1 {top:0}</style>
    <p/>
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
  {tagName: 'tag2', html: '<p></p>', css: '#id1 {top:0}', attribs: '', js: '  this.click = function(e) {\n  }.bind(this);' }
]
```

Be aware that the `html` and `js` properties can contain raw line endings --i.e. unescaped.


## Parser options

In addition to the `type` attribute, `script` and `style` tags can include additional configuration at tag level through the `options` attribute.

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

**NOTE:** The `options` attribute must comply with the [JSON specs](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf), i.e. with double-quoted property names and strings, in a format suitable for `JSON.parse`


## The JavaScript

Where the html ends? or where should I put my JavaScript?

### The untagged JS block

The first action taken by the compiler is send the received source to any html parser.
After that, it normalizes line endings to `\n` and removes _html_ comments.
Once prepared the source, searches the tags, separate its parts (closing/opening tag, root
attributes, and content). In the content, one by one, removes the `style` blocks and sends its
content to the CSS parser. Next, it does the same for the `script` tags.
This is done in the entire content.

In the remaining content, looks for the last html tag which ends a line.
If found, this closing tag signals the end of the html markup and the beginning of the JavaScript code.
If not found, all remaining is considered JavaScript.

So, you can put html comments, `style`, and `script` blocks, anywhere inside the tag.
The only restriction is that the untagged JavaScript code must finish the content and you can't use JavaScript comments out of this block.

### Multiple JavaScript blocks

Each JavaScript block in the tag can have different `type` attributes.
Once parsed, all blocks will be merged by the compiler.

### Loading JavaScript from the file system (v2.3.13)

The `src` attribute of the `script` tags inside a riot tag, allows load source files from the file system.
The filename in `src` can be absolute or relative to the tag being compiled.
It can be combined with the `charset` attribute. `charset` defaults to `utf8` and the JavaScript type defaults to the `type` option specified in the options passed to the compiler.

For this feature to work, you need to pass a third parameter to the `compile` function: the name of the file being compiled.

Example:
```js
var compile = require('riot-compile'),
    fs = require('fs')
var source = fs.readFileSync(full_filename, 'utf8')
var result = compiler.compile(source, options, full_filename)
```

So, if we have a mytag.tag and a js/data.js file...
```js
// ./js/data.js file
this.title = "my title"
```
```html
// ./mytag.tag file
<my-tag>
  <p>{ title }</p>
  <script src="js/data.js" type="es6"></script>
</my-tag>
```

the result is equivalent to
```html
<my-tag>
  <p>{ title }</p>
  <script type="es6">
  this.title = "my title"
  </script>
</my-tag>
```

## Style

(WIP)

### Scoped style

(WIP)
