[![Build Status][travis-image]][travis-url]
[![Issue Count][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Documentation

- [API](doc/)

## Installation

### Npm

`$ npm install riot-compiler --save`

### Read more in the [doc folder](doc/) and the [CHANGELOG](CHANGELOG.md)

_Please note: the documentation is a work in progress. Contributions are welcome._

#### For babel users

* babel - For `babel-core` v6.x - You must `npm install babel-preset-es2015-riot` too, for this to work.

### Known Issues

* Expressions within attribute values containing `>` must be enclosed in quotes. Ex: `<mytag hidden="{ a > 5 }">`.
* Shorthands within attributes parsed by CoffeeScript must be prefixed with a caret: `<mytag class="{^ c:1 }">`

[travis-image]:  https://img.shields.io/travis/riot/compiler.svg?style=flat-square
[travis-url]:    https://travis-ci.org/riot/compiler
[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:   LICENSE.txt
[npm-version-image]:   https://img.shields.io/npm/v/riot-compiler.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dm/riot-compiler.svg?style=flat-square
[npm-url]:             https://npmjs.org/package/riot-compiler
[coverage-image]:    https://codeclimate.com/github/riot/compiler/badges/coverage.svg
[coverage-url]:      https://codeclimate.com/github/riot/compiler/coverage
[codeclimate-image]: https://codeclimate.com/github/riot/compiler/badges/issue_count.svg
[codeclimate-url]:   https://codeclimate.com/github/riot/compiler
