riot.define('simple-template', {
  render(r) {
    r`
      <p>${ this.message }</p>
    `
  }
})