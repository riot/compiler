<raw-html>
  <!-- expression with html -->
  <p>{= [address1,address2].join('<br>') }</p>

  <p onclick={ swap }>
    {= '<' + myElem + ' style="color: ' + myColor + ';">\n  Click\n</' + myElem + '><br>\n<b>me</b>' }
  </p>

  this.address1 = '1234 Peachtree'
  this.address2 = 'Atlanta'
  this.myElem = 'span'
  this.myColor = 'red'
  swap() {
    this.myElem = this.myElem === 'span' ? 'p' : 'span'
  }
</raw-html>
