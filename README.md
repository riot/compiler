[![Build Status][travis-image]][travis-url]
[![Issue Count][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Installation

```
npm i @riotjs/compiler -D
```

## Usage

The riot compiler is completely asynchronous and it can compile only strings:

```js
import { compile } from '@riotjs/compiler'

const { code, map } = await compile('<p>{hello}</p>')
```

You can compile your tags also using the new `registerPreprocessor` and `registerPostprocessor` APIs for example:

```js
import { compiler, registerPreprocessor, registerPostprocessor } from '@riotjs/compiler'
import pug from 'pug'
import buble from 'buble'

// process your tag template before it will be compiled
registerPreprocessor('template', 'pug', async function(code, { file }) {
  console.log('your file path is:', file)
  return await pug.compile(code)
})

// your compiler output will pass from here
registerPostprocessor(async function(code, { file }) {
  console.log('your file path is:', file)
  return await buble.transform(code)
})

const { code, map } = await compile('<p>{hello}</p>', {
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
- *preprocessorFn*: function receiving the code as first argument and the current options as second, it can be also asynchronous


### registerPostprocessor(postprocessorFn)
#### @returns `Set` containing all the postprocessors registered

- *postprocessorFn*: function receiving the compiler output as first argument and the current options as second, it can be also asynchronous


[travis-image]:  https://img.shields.io/travis/riot/compiler.svg?style=flat-square
[travis-url]:    https://travis-ci.org/riot/compiler
[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:   LICENSE.txt
[npm-version-image]:   https://img.shields.io/npm/v/riotjs@compiler.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dm/riotjs@compiler.svg?style=flat-square
[npm-url]:             https://npmjs.org/package/riotjs@compiler
[coverage-image]:    https://img.shields.io/coveralls/riot/compiler/master.svg?style=flat-square
[coverage-url]:      https://coveralls.io/r/riot/compiler?branch=master
[codeclimate-image]: https://api.codeclimate.com/v1/badges/37de24282e8d113bb0cc/maintainability
[codeclimate-url]:   https://codeclimate.com/github/riot/compiler
