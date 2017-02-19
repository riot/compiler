<async>
  <h1>async test</h1>

  <script>
    foo() {
      return 'foo'
    }

    async doAsyncThing() {
      await new Promise((resolve) => {setTimeout(resolve,2000)});
      console.log("done");
    }

    * bar() {
      yield baz
    }
  </script>
</async>