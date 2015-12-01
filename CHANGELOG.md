# Compiler Changes

## v2.3.15
- Regression for fix [riot#1120](https://github.com/riot/riot/issues/1120), browsers behavior is inconsistent, `tmpl` can parse double-quotes within expressions.

## v2.3.14

- The prefix `__` for boolean attributes is not used anymore. This IE8 hack and it is not neccessary for current supported versions.
- Option `exclude` for ignore parts of the tag. This is an array with one or more of 'html', 'css', 'attribs', 'js'.
- Removed `inert` from the boolean attributes list, this html5 attribute was dropped from the specs.
- Fixed normalization of root attributes, was not working as expected. Example updated.

## v2.3.13

- Fixed the `style` option for setting the CSS parser through the `options` object.
- Fixed an issue in preservation of line endings in the generated html markup.
- Fixed tests, coverage is 100% again.
- Updated [doc/guide.md](https://github.com/riot/compiler/blob/master/doc/guide.md) and [doc/attributes.md](https://github.com/riot/compiler/blob/master/doc/attrbutes.md) with the latest features.

## v2.3.12

- Gets rid of the zero-indentation restriction for custom tags, now you can indent these tags, but the opening and closing tag must have exactly the same indentation (length and type). All the tag will be unindented by this amount.
- Support for `src` and `charset` attributes in `<script>` tags for reading JavaScript sources from the file system - [riot#1116](https://github.com/riot/riot/issues/1116), [riot#507](https://github.com/riot/riot/issues/507)
- The `compile` function can return separate parts by setting the new `entities` option. These parts has unescaped newlines.
- New attribute `options` for `script` and `style` tags will append/overwrite attributes in the default configuration object of the parser at tag level.
- Fix [riot#1261](https://github.com/riot/riot/issues/1261): `<pre>` tag does not preserve neither `\n` nor `\t`.
  Now whitespace within `<pre>` tags is always preserved.
- Fix [riot#1358](https://github.com/riot/riot/issues/1358): Empty style in tag (scoped) breaks.

## v2.3.11

- New type="babel" supports babel-core v6.x. You must `npm install babel-preset-es2015` too, for this works.
  Use type="es6" for babel and babel-core v5.8.x and bellow - [riot#1039](https://github.com/riot/riot/issues/1039)
- Fix [riot#1306](https://github.com/riot/riot/issues/1306): Compiler preserves newlines in class objects, causing "Unterminated String Constant" errors.
- Fix [riot#1314](https://github.com/riot/riot/issues/1314): `settings.brackets` no longer works.
- Fix [riot#1309](https://github.com/riot/riot/issues/1309): Tag renders js instead of content when no attributes present.

## v2.3.0

This is a complete rewrite and the first solo version of the compiler.

- Now the compiler generates a call to the new `riot.tag2` function, with the same parameters as `riot.tag` and an
  additional one: the brackets used in the compilation. `riot.tag2` requires all parameters except the brackets,
  so the compiler generates all but ignores the brackets if there are no generated expressions.
- Unlike previous versions, backslashes are removed from the expressions (before being sent to any parser).
  Outside of expressions, all backslashes are preserved.
- Double quotes inside expressions are converted to `&quot;`, to avoid issues with HTML markup.
- Fix [riot#1207](https://github.com/riot/riot/issues/1207): Riot compiler/parser breaks indentation.
- Fix [riot#1120](https://github.com/riot/riot/issues/1120): Double quotes break Riot attributes

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
