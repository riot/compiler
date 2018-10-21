<my-component>
  <h1 if={ title }>{ title }</h1>

  <ul>
    <li onclick={ onClick } each={ item in items }>{ item.value }</li>
  </ul>

  <script>
    import assert from 'assert'

    const goodbye = 'goodbye'
    export default {
      onMount() {
        console.log('mounted!')
      },
      onClick() {
        this.title = goodbye
      }
    }

    function bar() { return 'bar' }
  </script>

  <style>
    :root {
      color: red;
    }
  </style>
</my-component>