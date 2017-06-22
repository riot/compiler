<es6-nested-tl>
  <h1>{ message }</h1>

  <script>
    this.message = `//www.riotjs.com/guide`

    this.text = `
      The message is:
      ${ `http:${message}` } or '${ `http:` + `${message}` }' => ${ `"http:${message}"` }

      ${ [1,2,3].map(n => `\`${n}`) }
`

    this.foobar = `

    foobar() {
      return ${ /* preserve? */
        foo(`}`, '`')
        // can't output this?
      }
    }

`

  </script>
</es6-nested-tl>
