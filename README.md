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

The riot compiler is completely asynchronous and it can accepts only strings:

```js
import { compile } from '@riotjs/compiler'

const { code, map } = await compile('<p>{hello}</p>')
```

You can compile your tags also using preprocessors and postprocessors for example:

```js
import { compiler, registerPreprocessor, registerPostprocessor } from '@riotjs/compiler'
import pug from 'pug'
import buble from 'buble'

// process your tag template before it will be compiled
registerPreprocessor('template', 'pug', pug.compile)

// your compiler output will pass from here
registerPostprocessor(function(code) {
  return buble.transform(code)
})

const { code, map } = await compile('<p>{hello}</p>', {
  // specify the template preprocessor
  template: 'pug'
})
```



[travis-image]:  https://img.shields.io/travis/riot/compiler.svg?style=flat-square
[travis-url]:    https://travis-ci.org/riot/compiler
[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:   LICENSE.txt
[npm-version-image]:   https://img.shields.io/npm/v/riot-compiler.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dm/riot-compiler.svg?style=flat-square
[npm-url]:             https://npmjs.org/package/riot-compiler
[coverage-image]:    https://img.shields.io/coveralls/riot/compiler/master.svg?style=flat-square
[coverage-url]:      https://coveralls.io/r/riot/compiler?branch=master
[codeclimate-image]: https://api.codeclimate.com/v1/badges/37de24282e8d113bb0cc/maintainability
[codeclimate-url]:   https://codeclimate.com/github/riot/compiler
