'use strict'    // eslint-disable-line strict, global-strict

var compiler23 = require('../dist/compiler.js').compile,
    compiler22 = require('./v223/compiler223.js').compile,
    tmpl23 = require('riot-tmpl').tmpl,
    tmpl22 = require('./v223/compiler223.js').tmpl,
    assert = require('assert'),
    path = require('path'),
    fs = require('fs')

var basedir = path.join(__dirname, 'server-specs', 'fixtures'),
    tags = ['box', 'input-last', 'mixed-js', 'same', 'scoped', 'timetable'],
    t22, tt22 = [],
    t23, tt23 = []

var data = { num: 1, str: 'string', date: new Date(), bool: true, item: null },
    exprList = [
      ['{ date }', data.date],
      ['{ num === 0 ? 0 : num }', data.num],
      ['<p>{str}</p>', '<p>string</p>'],
      [' "{ str.slice(0, 3).replace(/t/, \'T\') }" ', ' "sTr" '],
      ['{this.num}', 1],
      ['{ !bool }', false],
      ['{}', undefined]
    ],
    csList = [
      ['{ foo: num }', 'foo'],
      ['{ foo: num, bar: item }', 'foo'],
      ['{ foo: date.getFullYear() > 2000, bar: str==this.str }', 'foo bar']
    ]

var files = tags.map(function (f) {
  f = path.join(basedir, f + '.tag')
  return fs.readFileSync(f, { encoding: 'utf8' })
})


var LOOP = 1500, EXPS = 10000, TMAX = 12, CPAD = 12, NPAD = 11, mem22, mem23

console.log()
console.log('Testing each compiler with %d files, %dx%d iterations (%d total)',
  tags.length, TMAX-2, LOOP, tags.length * (TMAX-2) * LOOP)

console.log('Testing compiler v2.2.4 ...')
mem22 = [0, 0, 0]
test(compiler22, tt22, mem22)
t22 = tt22.reduce(numsum)

console.log('Testing compiler v2.3.0 ...')
mem23 = [0, 0, 0]
test(compiler23, tt23, mem23)
t23 = tt23.reduce(numsum)

console.log()
console.log('%s   Compiler 2.2.4   new v2.3.0 ', padr('Results', CPAD))
console.log('%s   --------------   ----------', replicate('-', CPAD))
tags.forEach(function (f, n) {
  console.log('%s:  %s    %s', padr(f, CPAD), padl(tt22[n], NPAD), padl(tt23[n], NPAD))
})
console.log('%s:  %s    %s', padr('TOTAL', CPAD), padl(t22, NPAD), padl(t23, NPAD))
console.log()
console.log('Memory')
//console.log('%s:  %s    %s', padr('Res set size', CPAD), padl(mem22[0], NPAD), padl(mem23[0], NPAD))
console.log('%s:  %s    %s', padr('Heap total',   CPAD), padl(mem22[1], NPAD), padl(mem23[1], NPAD))
console.log('%s:  %s    %s', padr('Heap used',    CPAD), padl(mem22[2], NPAD), padl(mem23[2], NPAD))

console.log()
console.log('For tmpl, %d expressions & %d shorthands, %d iterations each',
  exprList.length, csList.length, (TMAX-2) * EXPS)

var ex22a, ex22b, ex23a, ex23b

console.log('tmpl v2.2.4 ...')
mem22 = [0, 0, 0]
testExpr(tmpl22, data, tt22, exprList, mem22)
ex22a = tt22.reduce(numsum)
testExpr(tmpl22, data, tt22, csList, mem22)
ex22b = tt22.reduce(numsum)

console.log('tmpl v2.3.0 ...')
mem23 = [0, 0, 0]
testExpr(tmpl23, data, tt23, exprList, mem23, 1)
ex23a = tt23.reduce(numsum)
testExpr(tmpl23, data, tt23, csList, mem23, 1)
ex23b = tt23.reduce(numsum)

console.log()
console.log('%s    tmpl 2.2.4   new v2.3.0', padr('Results', CPAD))
console.log('%s    ----------   ----------', replicate('-', CPAD))
console.log('%s:  %s %s', padr('Expressions', CPAD), padl(ex22a, NPAD), padl(ex23a, NPAD))
console.log('%s:  %s %s', padr('Shorthands',  CPAD), padl(ex22b, NPAD), padl(ex23b, NPAD))
console.log('%s:  %s %s', padr('TOTAL',       CPAD), padl(ex22a + ex22b, NPAD), padl(ex23a + ex23b, NPAD))
console.log()
console.log('Memory')
//console.log('%s:  %s %s', padr('Res set size', CPAD), padl(mem22[0], NPAD), padl(mem23[0], NPAD))
console.log('%s:  %s %s', padr('Heap total',   CPAD), padl(mem22[1], NPAD), padl(mem23[1], NPAD))
console.log('%s:  %s %s', padr('Heap used',    CPAD), padl(mem22[2], NPAD), padl(mem23[2], NPAD))
console.log()

console.log('NOTES:')
console.log('- memory is the difference of process.memoryUsage() between process.gc() and the end of the test.')
console.log('- both tmpl version times excludes expression compilation, memory diffs does include these.')
console.log('- minimum & maximum times are removed in all tests.')

/*
  Test for the compiler
*/
function test(compiler, times, agc) {
  var ogc, gc1, gc2, gc3
  global.gc()
  global.gc()
  ogc = process.memoryUsage()
  gc1 = ogc.rss
  gc2 = ogc.heapTotal
  gc3 = ogc.heapUsed

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

  ogc = process.memoryUsage()
  agc[0] += ogc.rss - gc1
  agc[1] += ogc.heapTotal - gc2
  agc[2] += ogc.heapUsed - gc3
}

function testExpr(tmpl, data, times, list, agc, v23) {
  var ogc, gc1, gc2, gc3
  times.length = 0
  global.gc()
  global.gc()
  ogc = process.memoryUsage()
  gc1 = ogc.rss
  gc2 = ogc.heapTotal
  gc3 = ogc.heapUsed

  list.forEach(function (pair, idx) {
    var tt = new Array(TMAX),
        s, i, j,
        expr = pair[0]

    if (v23) expr = tmpl.parse(expr)
    s = tmpl(expr, data)
    //assert(s === pair[1])
    if (s !== pair[1])
      throw new Error('`' + s + '` in #' + idx  + ' is not `' + pair[1] + '`')

    for (i = 0; i < tt.length; ++i) {
      tt[i] = Date.now()
      for (j = 0; j < EXPS; ++j) {
        s = tmpl(expr, data)
      }
      tt[i] = Date.now() - tt[i]
    }

    // discard min & max times
    tt.sort(numsort).pop()
    tt.shift()
    times[idx] = tt.reduce(numsum)
  })

  ogc = process.memoryUsage()
  agc[0] += ogc.rss - gc1
  agc[1] += ogc.heapTotal - gc2
  agc[2] += ogc.heapUsed - gc3
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
