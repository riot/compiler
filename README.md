[![Build Status][travis-image]][travis-url]
[![Code Quality][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Documentation

- [API](doc/)

## Installation

### Npm

`$ npm install riot-compiler --save`

### Bower

`$ bower install riot-compiler --save`

### For babel users

Due to recent changes in the babel API, from v2.3.0-beta.7 we are supporting `babel` versions previous to 6.0.2 through `parsers.css.es6` (`<script type="es6">`), new versions are not compatible with the node API.

For `babel-core`, please use the new `parsers.css.babel` (`<script type="babel">`). You must `npm install babel-preset-es2015` too, for this works.


[travis-image]:https://img.shields.io/travis/riot/compiler.svg?style=flat-square
[travis-url]:https://travis-ci.org/riot/compiler
[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt
[npm-version-image]:http://img.shields.io/npm/v/riot-compiler.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/riot-compiler.svg?style=flat-square
[npm-url]:https://npmjs.org/package/riot-compiler
[coverage-image]:https://img.shields.io/coveralls/riot/compiler/master.svg?style=flat-square
[coverage-url]:https://coveralls.io/r/riot/compiler/?branch=master
[codeclimate-image]:https://img.shields.io/codeclimate/github/riot/compiler.svg?style=flat-square
[codeclimate-url]:https://codeclimate.com/github/riot/compiler
