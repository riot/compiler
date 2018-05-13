riot.tag2('es6-template-strings', '<h1>{message}</h1>', '', '', function(opts) {
    this.message = `http://www.riot.js.org/guide`

    this.text = `
      The message is:
      ${ message }

      ${ [1,2,3].map(function(n) { return n }) }
      ${ [1,2,3].map(n => n) }
`
});