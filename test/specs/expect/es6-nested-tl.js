riot.tag2('es6-nested-tl', '<h1>{message}</h1>', '', '', function(opts) {
    this.message = `//www.riot.js.org/guide`

    this.text = `
      The message is:
      ${ `http:${message}` } or '${ `http:` + `${message}` }' => ${ `"http:${message}"` }

      ${ [1,2,3].map(n => `\`${n}`) }
`

    this.foobar = `

    foobar() {
      return ${
        foo(`}`, '`')

      }
    }

`

});
