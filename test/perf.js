/*
  Performance test for the compiler
*/
/* eslint no-console: 0, max-len: 0, no-unused-vars: 0 */
'use strict'

var
  compiler23 = require('../').compile,
  compiler22 = require('./v223/compiler223.js').compile,
  path = require('path'),
  fs = require('fs')

var
  basedir = path.join(__dirname, 'v223'),
  files = [],
  tags = getFiles(basedir, files)

var
  LOOP = 5000,
  TMAX = 12,
  CPAD = 12,
  NPAD = 9,
  mem22, t22, tt22 = [],
  mem23, t23, tt23 = []

console.log()
console.log('Performance test for the riot-compiler v2.3 againts the v2.2.3 release')
console.log('======================================================================')
console.log()
console.log('Testing each compiler with %d files, %dx%d iterations (%d total)',
  tags.length, TMAX - 2, LOOP, tags.length * (TMAX - 2) * LOOP)

console.log('Running the compiler v2.2.4 ...')
mem22 = {}
test(compiler22, tt22, mem22)
t22 = tt22.reduce(numsum)

console.log('Running the compiler v2.3.x ...')
mem23 = {}
test(compiler23, tt23, mem23)
t23 = tt23.reduce(numsum)

console.log()
console.log('%s   old 2.2.4   new 2.3.x',  padr('Results', CPAD + 1))
console.log('%s  ----------- -----------', replicate('-', CPAD + 1))
tags.forEach(function (f, n) {
  console.log('%s:  %s   %s', padr(f, CPAD), padl(tt22[n], NPAD), padl(tt23[n], NPAD))
})
console.log('%s:  %s   %s', padr('TOTAL', CPAD), padl(t22, NPAD), padl(t23, NPAD))
console.log()
console.log('%s:%s%s', padr('Memory used', CPAD),
  padl(mem22.heapUsed.toLocaleString(), CPAD), padl(mem23.heapUsed.toLocaleString(), CPAD))

console.log()
console.log('NOTES:')
console.log('- Memory used is the difference during the test of the heapTotal info')
console.log('  provided by the node process.memoryUsage function (very erratic).')
console.log('- Minimum & maximum times are removed.')
console.log()

function preLoad () {
  tags.forEach(function (t, i) {
    var p = path.join(__dirname, 'v223', t + '.js')

    //fs.writeFileSync(p, compiler22(files[i]), 'utf8')
    compiler22(files[i])
    compiler23(files[i])
  })
}

function test (compiler, times, ogc) {
  global.gc()
  global.gc()
  var gcm = process.memoryUsage().heapUsed

  files.forEach(function (text, idx) {
    var
      tt = new Array(TMAX),
      i, j

    for (i = 0; i < tt.length; ++i) {
      tt[i] = Date.now()
      for (j = 0; j < LOOP; ++j) {
        compiler(text)
      }
      tt[i] = Date.now() - tt[i]
    }

    // discard min & max times
    tt.sort(numsort).pop()
    tt.shift()
    times[idx] = tt.reduce(numsum)
  })

  ogc.heapUsed = process.memoryUsage().heapUsed - gcm
}

function numsort (a, b) {
  return a - b
}
function numsum (a, b) {
  return a + b
}
function replicate (s, n) {
  return n < 1 ? '' : (new Array(n + 1)).join(s)
}
function padr (s, n) {
  s = '' + s
  return s + replicate(' ', n - s.length)
}
function padl (s, n) {
  s = '' + s
  return replicate(' ', n - s.length) + s
}

function getFiles (base, src) {
  var
    dir = fs.readdirSync(base),
    tgs = [],
    f, n

  for (var i = 0; i < dir.length; i++) {
    n = dir[i]
    if (path.extname(n) === '.tag') {
      f = path.join(base, n)
      tgs.push(n.slice(0, -4))
      src.push(fs.readFileSync(f, { encoding: 'utf8' }))
    }
  }
  return tgs
}
