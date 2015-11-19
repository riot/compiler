# Compiler Guide (complement, WIP)

## Indentation

In v2.3.12 the compiler handles a more consistent and flexible indentation in both inline and external tag definitions.
You can use any tabs or spaces you want. The compiler uses this to find the closing tag and unindent the content, so the closing tag must have _exactly_ the same indentation of the opening tag.

HTML comments and trailing whitespace are removed from the entire tag content (JavaScript comments are removed in the JavaScript block only, so you can not use comment in expressions).

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
  click(e) {}   // JavaScript code is unindented by 2 spaces
});
```
note the `<pre>` content, this is unindented by 2 too.

## Backslashes and Whitespace

From the perspective of the riot compiler and `tmpl`, backslashes in the template are characters with no special meaning. The compiler preserves them in the HTML and expressions, with one exception: backslashes used to escape riot brackets are temporarily removed when the expression is passed to a parser, and finally removed at runtime, before evaluating the expression.

In quoted strings and regexes inside expressions, all whitespace are preserved.
In the html, including quoted text, newlines are converted to spaces and compacted, except if you pass the `whitespace` option to the compiler. With this option

No matter which options are used, newlines are normalized to `\n` and trailing spaces are removed.

## Options

The compile and riot.compile functions can take an additional parameter specifing various settings. This is a plain JavaScript object with one or more of following options as properties.

| option      | module  | type    | description |
| ----------- |:------: |:------: | ----------- |
| brackets    | html    | string  | Change brackets used for expressions. Defaults to `{ }` in the server, current custom brackets in the browser
| expr        | html    | boolean | Run expressions through the parser defined with the `type` option
| compact     | html    | boolean | Remove spaces between tags (minify `</p> <p>` to `</p><p>`)
| whitespace  | html    | boolean | Preserve newlines and tabs. newlines are normalized anyway
| template    | html    | string  | HTML pre-processor. Built-in support for: jade
| type        | js      | string  | JavaScript pre-processor. Built-in support for: es6, babel, coffeescript, typescript, livescript, none
| style       | css     | string  | CSS pre-processor. Built-in support for: jade


## Options as attributes

In addition to the `type` attribute, script and style tags can include additional configuration in the `options` and `compile` attributes, at tag level.

**NOTE:** These attributes are not expressions, are [JSON](http://json.org/) objects and must comply with the [JSON specs](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf), i.e. suitable for `JSON.parse`.

The `options` attribute specify options for the JS or CSS parser.

Example:
```html
<my-tag>
  <style type='' options='{}'>
  </style>
  <p>Red</p>
</my-tag>
```
will ...

The `compile` attribute specify options for the compiler, and must be defined in the root tag.

Example:
```html
<my-tag compile='{ "whitespace": true }'>
  <pre>This is
    multiline
    text.
  </pre>
</my-tag>
```
will compile my-tag with the whitespace option, even if whitespace is not enabled in the global options

## The untagged JS block

Where the html ends?


## Multiple JavaScript blocks

Different types.
Merged with any untagged JS block

## Loading JavaScript from the file system

The `src` attribute of `script` tags inside a riot tag, allows load source files from the file system.
The filename in `src` can be absolute or relative to the tag being compiled.
It can be combined with the `charset` attribute. `charset` defaults to `utf8` and the JavaScript type defaults to the `type` option specified in the options passed to the compiler.

Example:
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
is equivalent to
```html
<my-tag>
  <p>{ title }</p>
  <script type="es6">
  this.title = "my title"
  </script>
</my-tag>
```
