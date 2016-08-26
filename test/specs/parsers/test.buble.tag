
<buble>

  <h3>{ test }</h3>

  this.parser = 'Buble'

  const type = 'JavaScript'
  this.test = `This is ${ type } with ${ this.parser }`

  this.on('mount', () => {
    this.parser = 'bublé'
  })

</buble>
