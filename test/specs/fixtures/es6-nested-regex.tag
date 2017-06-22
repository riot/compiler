<es6-nested-regex>
  <h1>{ message }</h1>

  <script>
    const x = 1

    this.message = `
      regex: ${
        /x}`/.source
      }`

    this.foobar = `
    foobar() {
      return ${
        foo( 5 /x/.1 )  // not regex
      }
    }
`

  foo(bar) {}

  </script>
</es6-nested-regex>
