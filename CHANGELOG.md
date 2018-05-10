# Compiler Changes

### v3.5.1
- Fix try importing `@babel/core` first and then fallback to `babel-core` for the `es6` parser

### v3.5.0
- Add support for Babel 7

### v3.4.0
- Add inline sourcemap support via `sourcemap='inline'` option

### v3.3.1
- Improve the sourcemap generation adding the `sourceContent` key

### v3.3.0
- Add initial experimental sourcemaps support via `sourcemap: true` option

### v3.2.6
- Fix #105
- Fix #104

### v3.2.5
- Update dependencies and refactor some internal code avoiding bitwise operators
- Fix coffeescript parser require https://github.com/riot/compiler/pull/102

### v3.2.4
- Fix [riot#2369](https://github.com/riot/riot/issues/2369) : Possible bug involving compilation of tags containing regex.
- Using the `skip-regex` function from npm for sharing bwteen modules (at future).
- Using the `jsSplitter` function for safer replacement of JS code, part of the next compiler.

### v3.2.3
- Fixes various issues with literal regexes.

### v3.1.4
- Fix avoid the `filename` option for the babel-standalone parser

### v3.1.3
- Fix babel in browser runtime parser https://github.com/riot/examples/issues/51

### v3.1.2
- Fix [riot#2210](https://github.com/riot/riot/issues/2210) : Style tag get stripped from riot tag even if it's in a javascript string.
- Updated devDependencies.

### v3.1.0
- Adds support for css @apply rule: now ScopedCSS parser can handle it properly

### v3.0.0
- Deprecate old `babel` support, now the `es6` parser will use Babel 6 by default
- Change css always scoped by default
- Fix all the `value` attributes using expressions will be output as `riot-value` to [riot#1957](https://github.com/riot/riot/issues/1957)

### v2.5.5
- Fix to erroneous version number in the package.json, v2.5.4 was released before.
- Removed unuseful files from the npm package.
- Updated credits in package.json
- Updated devDependencies, skip ESLint in CI test for node v0.12
- BuGless-hack for [riot#1966](https://github.com/riot/riot/issues/1966) - You can use `<-/>` to signal the end of the html if your html is ending with an expression.

### v2.5.4
- Fix #68 : SASS inside Pug template gives Invalid CSS.
- Added parser for [bublé](https://buble.surge.sh) as `buble` in the browser. Option `modules` is `false` in all versions.
- Added parser for [bublé](https://buble.surge.sh) as `buble`.
- Added support for es6 `import` statements. Thanks to @kuashe! - Related to [riot#1715](https://github.com/riot/riot/issues/1715), [riot#1784](https://github.com/riot/riot/issues/1784), and [riot#1864](https://github.com/riot/riot/issues/1864).

### v2.5.3
- Fix #73 : resolveModuleSource must be a function - Option removed from the default Babel options.
- Updated node.js to 4.4 in the Travis environment.
- Downgraded ESLint to 2.x for using with node v0.12.x

### v2.5.2
- Fix #72: `undefined` is not a function when evaluating `parsers._req`.
- Updated node versions for travis, including v5.x

### v2.4.1

- Add the `pug` parser (it will replace completely `jade` in the next major release)
- Add the possibility to pass custom parsers options directly via the `compiler.compile` method through the `parserOptions: {js: {}, template: {}, style: {}}` key [more info](https://github.com/riot/compiler/issues/64)
- Fix un-escape parser options in html [more info](https://github.com/riot/compiler/issues/63)

### v2.3.23
- The parsers are moved to its own directory in the node version. The load is on first use.
- Fix [riot#1325](https://github.com/riot/riot/issues/1325) : Gulp + Browserify + Babelify + type="es6" error.
- Fix [riot#1342](https://github.com/riot/riot/issues/1342), [riot#1636](https://github.com/riot/riot/issues/1636) and request from [dwyl/learn-riot#8](https://github.com/dwyl/learn-riot/issues/8) : Server-Side Rendered Page Fails W3C Check. The new `data-is` attribute is used for scoped styles in addition to `riot-tag` (the later will be removed in compiler v3.x)
- The keyword `defer` in `<script src=file>` avoids that the compiler loads the file, preserving the tag - Requested by [riot#1492](https://github.com/riot/riot/issues/1492) : Stop script tags from being evaluated with serverside `riot.render`. It is removed in client-side compilation because browsers will not load scripts through innerHTML.
- It has changed the character used to hide expressions during the compilation, maybe this fix [riot#1588](https://github.com/riot/riot/issues/1588) : Syntax Error: Invalid character `\0129` (riot+compiler.min).
- The option `debug` inserts newlines between the `riot.tag2` parameters and the call is prefixed with the source filename - Requested by [riot#1646](https://github.com/riot/riot/issues/1646) : Split portions of generated html with newline instead of space
- Removed the unused parameter with the compiled-time brackets from the call to `riot.tag2`.
- Removed support for raw expressions. It is unlikely this feature will be implemented in v2.3.x
- Updated the regex that is used to match tag names, more closer to the HTML5 specs.
- Update devDependencies.

### v2.3.22
- Fix [riot#1511](https://github.com/riot/riot/issues/1511) : Escape Quotes - They may be some issues to fix.
- Regression of logic to parse style and script tags, due to loss of performance and other issues.
- Removed the "compress" option of the `less` parser, which is deprecated and generates warnings in the console.
- Removed the unuseful CSS parser `stylus` from the browser version.
- Refactorization of all the code, with more comments in preparation for the automatic documentation of the API.
- Various tweaks to increase performance and reduce (~55%) memory consumption.
- Files to preprocess are moved from "lib" to the "src" directory, now "lib" has the required node.js files only.

### v2.3.21 (unpublished due to errors)

### v2.3.20
- Fix [riot#1495](https://github.com/riot/riot/issues/1495) : Warning of input tag value - Avoids warnings for date/datetime/time/month/email/color types with expression in its value.
- Fix [riot#1488](https://github.com/riot/riot/issues/1488) : Cannot read property 'replace' of undefined when compiling in Node a tag with an import in its less stylesheet -- Thanks to @jrx-jsj
- Fix [riot#1448](https://github.com/riot/riot/issues/1448) : Riot compiler parses and removes content from string declaration. This is partial fix, you need to write `<\/script>` for closing script tags within quoted strings.
- Revised regex that matches `<pre>` tags.
- `@import` directives of `stylus`, `sass`, `scss`, and `less` can be relative to the file being processed.
- Fixed lint issues with new .eslintrc.yml, almost compatible with [JavaScript Standard Style](http://standardjs.com/)

### v2.3.19
- Fixing issues with double quotes.
- Removed dependency on riot-tmpl for the node build, now we are using a local version of `brackets`.

### v2.3.18

- Regression of optimized regexes not working in IE9/10.
- Fix #36 : removed the excluded strings from the ouput.
- Fix: avoid changing the global brackets when the compiler is called with other brackets (requires riot-tmpl v2.3.15).
- A new property `version` (string) is included in the compiler set.
- Fixes to travis CI and the bump routine

### v2.3.15 (unpublished from npm)

- Preparation for use as ES6 module through [rollup.js](http://rollupjs.org/)
- Update devDependencies, including jspreproc v0.2.5 with an important fix.
- Partial regression of fix [riot#1120](https://github.com/riot/riot/issues/1120), `tmpl` can parse double-quotes within expressions, encoding double-quotes generates issues.

### v2.3.14

- The prefix `__` for boolean attributes is not used anymore. This IE8 hack and it is not neccessary for current supported versions.
- Option `exclude` for ignore parts of the tag. This is an array with one or more of 'html', 'css', 'attribs', 'js'.
- Removed `inert` from the boolean attributes list, this html5 attribute was dropped from the specs.
- Fixed normalization of root attributes, was not working as expected. Example updated.

### v2.3.13

- Fixed the `style` option for setting the CSS parser through the `options` object.
- Fixed an issue in preservation of line endings in the generated html markup.
- Fixed tests, coverage is 100% again.
- Updated [doc/guide.md](https://github.com/riot/compiler/blob/master/doc/guide.md) and [doc/attributes.md](https://github.com/riot/compiler/blob/master/doc/attrbutes.md) with the latest features.

### v2.3.12

- Gets rid of the zero-indentation restriction for custom tags, now you can indent these tags, but the opening and closing tag must have exactly the same indentation (length and type). All the tag will be unindented by this amount.
- Support for `src` and `charset` attributes in `<script>` tags for reading JavaScript sources from the file system - [riot#1116](https://github.com/riot/riot/issues/1116), [riot#507](https://github.com/riot/riot/issues/507)
- The `compile` function can return separate parts by setting the new `entities` option. These parts has unescaped newlines.
- New attribute `options` for `script` and `style` tags will append/overwrite attributes in the default configuration object of the parser at tag level.
- Fix [riot#1261](https://github.com/riot/riot/issues/1261) : `<pre>` tag does not preserve neither `\n` nor `\t`.
  Now whitespace within `<pre>` tags is always preserved.
- Fix [riot#1358](https://github.com/riot/riot/issues/1358) : Empty style in tag (scoped) breaks.

### v2.3.11

- New type="babel" supports babel-core v6.x. You must `npm install babel-preset-es2015` too, for this works.
  Use type="es6" for babel and babel-core v5.8.x and bellow - [riot#1039](https://github.com/riot/riot/issues/1039)
- Fix [riot#1306](https://github.com/riot/riot/issues/1306) : Compiler preserves newlines in class objects, causing "Unterminated String Constant" errors.
- Fix [riot#1314](https://github.com/riot/riot/issues/1314) : `settings.brackets` no longer works.
- Fix [riot#1309](https://github.com/riot/riot/issues/1309) : Tag renders js instead of content when no attributes present.

### v2.3.0

This is a complete rewrite and the first solo version of the compiler.

- Now the compiler generates a call to the new `riot.tag2` function, with the same parameters as `riot.tag` and an
  additional one: the brackets used in the compilation. `riot.tag2` requires all parameters except the brackets,
  so the compiler generates all but ignores the brackets if there are no generated expressions.
- Unlike previous versions, backslashes are removed from the expressions (before being sent to any parser).
  Outside of expressions, all backslashes are preserved.
- Double quotes inside expressions are converted to `&quot;`, to avoid issues with HTML markup.
- Fix [riot#1207](https://github.com/riot/riot/issues/1207) : Riot compiler/parser breaks indentation.
- Fix [riot#1120](https://github.com/riot/riot/issues/1120) : Double quotes break Riot attributes

Enhancements

- The compiler loads the brackets in runtime on each tag, allowing use of different brackets. [riot#1122](https://github.com/riot/riot/issues/1122) related.
- Multiple `<script>` blocks. These can have different types and are merged with the untagged script block, if any.
- More flexible formats in ES6 style method definitions.
- In the JavaScript, trailing whitespace are removed and multiple empty lines are combined into one.
- Better recognition of expressions. Now you can use almost any character, even in unquoted expressions (expressions containing the `>` operator needs to be enclosed in quotes) - [riot#744](https://github.com/riot/riot/issues/744)
- If the first character inside an expression is `^`, the expression is not passed to any parser. This is some sort of type=none at expression level - [riot#543](https://github.com/riot/riot/issues/543), [riot#1090](https://github.com/riot/riot/issues/1090)
- Type es6 now supports babel-core - [riot#1039](https://github.com/riot/riot/issues/1039)
- New logic for scoped style blocks, if a style contains the ":scoped" selector, this is replaced by the name of the root element, if not, the name is prepended - [riot#912](https://github.com/riot/riot/issues/912)
- `type="scoped-css"` for `style` tags is deprecated, use only `scoped` or `scoped="scoped"`
