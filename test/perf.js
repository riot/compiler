var LOOP = 1500,
    TMAX = 12

var compiler23 = require('../dist/compiler.js').compile,
    compiler22 = require('./v223/compiler223.js').compile,
    path = require('path'),
    fs = require('fs')

var basedir = path.join(__dirname, 'server-specs', 'fixtures'),
    tags = ['box', 'input-last', 'mixed-js', 'same', 'scoped', 'timetable'],
    t22, tt22 = [],
    t23, tt23 = []

var files = tags.map(function (f) {
  f = path.join(basedir, f + '.tag')
  return fs.readFileSync(f, { encoding: 'utf8' })
})


console.log()
console.log('Testing each compiler with %d files, %dx%d iterations (%d total)',
  tags.length, TMAX-2, LOOP, tags.length * (TMAX-2) * LOOP)


console.log('Testing compiler v2.2.4 ...')
test(compiler22, tt22)
t22 = tt22.reduce(numsum)

console.log('Testing compiler v2.3.0 ...')
test(compiler23, tt23)
t23 = tt23.reduce(numsum)

var PAD = 12
console.log()
console.log('%s   Compiler 2.2.4   Compiler 2.3.0', padr('Results', PAD))
console.log('%s   --------------   --------------', replicate('-', PAD))
tags.forEach(function (f, n) {
  console.log('%s:  %s      %s', padr(f, PAD), padl(tt22[n], 10), padl(tt23[n], 10))
})
console.log('%s:  %s      %s', padr('TOTAL', PAD), padl(t22, 10), padl(t23, 10))


function test(compiler, times) {

  files.forEach(function (text, idx) {
    var tt = new Array(TMAX),
        s, i, j

    for (i = 0; i < tt.length; ++i) {
      tt[i] = Date.now()
      for (j = 0; j < LOOP; ++j) {
        s = compiler(text)
      }
      tt[i] = Date.now() - tt[i]
    }

    // discard min & max times
    tt.sort(numsort).pop()
    tt.shift()
    times[idx] = tt.reduce(numsum)
  })
}

function numsort(a, b) {
  return a - b
}
function numsum(a, b) {
  return a + b
}
function replicate(s, n) {
  return n < 1 ? '' : (new Array(n + 1)).join(s)
}
function padr(s, n) {
  s = '' + s
  return s + replicate(' ', n - s.length)
}
function padl(s, n) {
  s = '' + s
  return replicate(' ', n - s.length) + s
}
