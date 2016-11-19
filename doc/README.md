# Compiler

## On browser

Following methods apply to browsers only. Jump to [server section](#compile-on-server) if you want to compile under node or io.js.

### <a name="compile"></a> compiler.compile(callback)

Compile all tags defined with `<script type="riot/tag">` to JavaScript. These can be inlined script definitions or external resources that load scripts defined with `src` attribute. After all scripts are compiled the given `callback` method is called. For example:

``` javascript
compiler.compile(function() {
  var tags = riot.mount('*')
})
```

You can leave out the `compiler.compile` call and write just:

``` javascript
var tags = riot.mount('*')
```

but you don't get to know when external resources are loaded and compiled and the return value is an empty array if you have external scripts. If all scripts are defined on the page then `compiler.compile` step can be left out.

For more details, read the compiler [general introduction](/guide/compiler/).

### <a name="compile-fn"></a> compiler.compile(url, callback)

Loads the given URL and compiles all tags after which the `callback` is called. For example:

``` javascript
compiler.compile('my/tags.tag', function() {
  // the loaded tags are ready to be used
})
```

### <a name="compile-tag"></a> compiler.compile(tag)

Compiles and executes the given `tag`. For example:

```html
<template id="my_tag">
  <my-tag>
    <p>Hello, World!</p>
  </my-tag>
</template>

<script>
compiler.compile(my_tag.innerHTML)
</script>
```

After the call you can use `my-tag` normally.

A tag definition is assumed if the first non- empty character is `<`, otherwise the argument is taken as URL.

@returns the compiled JavaScript as string

### <a name="compile-to-str"></a> compiler.compile(tag, true)

Compiles the `tag` and returns it as a string. Only the transformation from the tag to JavaScript is performed and the tag is not executed on the browser. You can use this method to benchmark the compiler performance for example.

``` js
var js = compiler.compile(my_tag.innerHTML, true)
```

## On server

After `npm install riot` you can do following:

```js
var riot = require('riot')

var js = compiler.compile(tag)
```

The compile function takes the tag definition (string) and returns JavaScript (string).

### <a name="css-parser"></a> compiler.parsers.css [tagName, css]

Custom parsers that could be used to compile your tags CSS. For example:

```js
compiler.parsers.css.myparser = function(tag, css) {
  return css.replace(/@tag/, tag)
}
```

```html
<custom-parsers>
  <p>hi</p>
  <style type="text/myparser">
    @tag {color: red;}
  </style>
</custom-parsers>
```

will be compiled to:

```html
<custom-parsers>
  <p>hi</p>
  <style type="text/myparser">
    custom-parsers {color: red;}
  </style>
</custom-parsers>
```

### <a name="js-parser"></a> compiler.parsers.js [js, options]

Custom parsers that could be used to compile your tags JavaScript. For example

```js
compiler.parsers.js.myparser = function(js) {
  return js.replace(/@version/, '1.0.0')
}
```

```html
<custom-parsers>
  <p>hi</p>
  <script type="text/myparser">
    this.version = "@version"
  </script>
</custom-parsers>
```

will be compiled to:

```html
<custom-parsers>
  <p>hi</p>
  <script type="text/myparser">
    this.version = "1.0.0"
  </script>
</custom-parsers>
```

### <a name="html-parser"></a> compiler.parsers.html [html]

Custom parsers that could be used to compile your tags HTML.

The predefined parsers are:

#### html
- `jade`

#### css
- `less`
- `sass`
- `scss`
- `stylus`

\* Only `less` is available on browsers.

#### js
- `none` or `javascript`
- `livescript`
- `typescript`
- `es6` - (using `babel-core` v6.x and the `es2015` preset)
- `buble`
- `coffee` or `coffeescript`

## Changes in v2.3.0

In previous versions, escaped brackets were preserved, generating incorrect HTML or invalid JavaScript code. This version removes them at an early stage, after passing the tag to the html parser and before the JavaScript code and expressions are sent to the js parser.
