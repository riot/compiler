/*
  Performance test for the compiler
*/
'use strict'    // eslint-disable-line strict, global-strict

var
  compiler23 = require('../dist/compiler.js').compile,
  compiler22 = require('./v223/compiler223.js').compile,
  tmpl23 = require('riot-tmpl').tmpl,
  tmpl22 = require('./v223/compiler223.js').tmpl,
  assert = require('assert'),
  path = require('path'),
  fs = require('fs')

var
  basedir = path.join(__dirname, 'specs', 'fixtures'),
  tags = ['box', 'empty', 'input-last', 'mixed-js', 'same', 'scoped', 'timetable', 'treeview', 'oneline'],
  data = { num: 1, str: 'string', date: new Date(), bool: true, item: null }

var files = tags.map(function (f) {
  f = path.join(basedir, f + '.tag')
  return fs.readFileSync(f, { encoding: 'utf8' })
})

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
  tags.length, TMAX-2, LOOP, tags.length * (TMAX-2) * LOOP)

console.log('Running the compiler v2.2.4 ...')
mem22 = {}
test(compiler22, tt22, mem22)
t22 = tt22.reduce(numsum)

console.log('Running the compiler v2.3.0 ...')
mem23 = {}
test(compiler23, tt23, mem23)
t23 = tt23.reduce(numsum)

console.log()
console.log('%s   old 2.2.4   new 2.3.0',  padr('Results', CPAD + 1))
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

function test(compiler, times, ogc) {
  var gcm
  global.gc()
  global.gc()
  gcm = process.memoryUsage().heapUsed

  files.forEach(function (text, idx) {
    var
      tt = new Array(TMAX),
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

  ogc.heapUsed = process.memoryUsage().heapUsed - gcm
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
