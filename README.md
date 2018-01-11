[![Build Status][travis-image]][travis-url]
[![Issue Count][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Info

WIP come back soon

## New specs

- All the code in the `<script>` tag will be left untouched without adding any extra riot magic
- The relation `riot tag => file.tag` will be 1 to 1 so it will be not possible to define multiple tags in the same file
- It will be not possible to define multiple `<script><template><style>` tags in the same file

## New feature

- The new compiler is per default async so it will always return a promise
- The source code will be simplified a lot avoiding to maintain different forks for the browser/node versions
- It will generate always sourcemaps
- It will be simpler to validate the riot tags syntax due to a cleaner and unambigous structure
- No need for `<virtual>` tags and other weird hacks
- Allow the rendering of raw markup

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
