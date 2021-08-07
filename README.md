[![Build Status][ci-image]][ci-url]
[![Issue Count][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Important

This compiler will not work with older Riot.js versions.
It's designed to work with Riot.js > 4.0.0.
For Riot.js < 4.0.0 please check the [v3](https://github.com/riot/compiler/tree/v3) branch

## Installation

```
npm i @riotjs/compiler -D
```

## Usage

The riot compiler can compile only strings:

```js
import { compile } from '@riotjs/compiler'

const { code, map } = compile('<p>{hello}</p>')
```

You can compile your tags also using the new `registerPreprocessor` and `registerPostprocessor` APIs for example:

```js
import { compiler, registerPreprocessor, registerPostprocessor } from '@riotjs/compiler'
import pug from 'pug'
import buble from 'buble'

// process your tag template before it will be compiled
registerPreprocessor('template', 'pug', function(code, { options }) {
  const { file } = options
  console.log('your file path is:', file)
  
  return {
    code: pug.render(code),
    // no sourcemap here
    map: null
  }
})

// your compiler output will pass from here
registerPostprocessor(function(code, { options }) {
  const { file } = options
  console.log('your file path is:', file)
  
  // notice that buble.transform returns {code, map}
  return buble.transform(code)
})

const { code, map } = compile('<p>{hello}</p>', {
  // specify the template preprocessor
  template: 'pug'
})
```

## API

### compile(string, options)
#### @returns `<Promise>{ code, map }` output that can be used by Riot.js

- *string*: is your tag source code
- *options*: the options should contain the `file` key identifying the source of the string to compile and
the `template` preprocessor to use as string

Note: specific preprocessors like the `css` or the `javascript` ones can be enabled simply specifying the `type` attribute
in the tag source code for example

```html
<my-tag>
  <style type='scss'>
    // ...
  </style>
</my-tag>
```

### registerPreprocessor(type, id, preprocessorFn)
#### @returns `Object` containing all the preprocessors registered

- *type*: either one of `template` `css` or `javascript`
- *id*: unique preprocessor identifier
- *preprocessorFn*: function receiving the code as first argument and the current options as second

### registerPostprocessor(postprocessorFn)
#### @returns `Set` containing all the postprocessors registered

- *postprocessorFn*: function receiving the compiler output as first argument and the current options as second


[ci-image]:https://img.shields.io/github/workflow/status/riot/compiler/test?style=flat-square
[ci-url]:https://github.com/riot/compiler/actions
[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:   LICENSE
[npm-version-image]:   https://img.shields.io/npm/v/@riotjs/compiler.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dm/@riotjs/compiler.svg?style=flat-square
[npm-url]:             https://npmjs.org/package/@riotjs/compiler
[coverage-image]:    https://img.shields.io/coveralls/riot/compiler/main.svg?style=flat-square
[coverage-url]:      https://coveralls.io/r/riot/compiler?branch=main
[codeclimate-image]: https://api.codeclimate.com/v1/badges/37de24282e8d113bb0cc/maintainability
[codeclimate-url]:   https://codeclimate.com/github/riot/compiler
