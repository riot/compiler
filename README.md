[![Build Status][travis-image]][travis-url]
[![Issue Count][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Info

WIP come back soon

## Idea

The idea is to generate valid javascript files from riot tag files
For example `my-tag.tag`:
```html
<template>
  <p onclick={ updateMessage('goodbye') }>
    { message }
  </p>

  <div if={ error }>
    <p>{ error }</p>
  </div>

  <ul>
    <li each={ item in items }>{ item.value }</li>
  </ul>
</template>

<script>
export default {
  updateMessage(message) {
    this.update({ message: 'goodbye', error: false })
  }
}
</script>

<style>
  :root {
    background: red;
  }
</style>
```

Will become:

```js
riot.define('my-tag', {
  store: {
    message: 'click me',
    error: 'i am an error',
    items: [{ value: 'foo'}, { value: 'bar' }]
  },
  updateMessage() {
    this.update({ message: 'goodbye', error: false })
  }
  get css() {
    return `
      :root {
        background: red;
      }
    `
  },
  render(h, store) {
    return h`
      <p onclick="${ this.updateMessage.bind(this, 'goodbye') }">
        ${ store.message }
      </p>${
        if (store.error) {
          `<div>
            <p>${ store.error }</p>
          </div>`
        }
      }<ul>${
          store.items.map((item) => {
            return `<li>${ item.value }</li>`
          })
      }</ul>
    `;
  }
})
```

Check for example [this demo](https://jsfiddle.net/gianlucaguarini/ed31q3qk/) to see how it's going to work

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
