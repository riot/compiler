'use strict'

var compiler23 = require('../dist/compiler.js').compile,
    compiler22 = require('./v223/compiler223.js').compile,
    tmpl23 = require('../dist/compiler.js').tmpl,
    tmpl22 = require('./v223/compiler223.js').tmpl,
    path = require('path'),
    fs = require('fs')

var basedir = path.join(__dirname, 'server-specs', 'fixtures'),
    tags = ['box', 'input-last', 'mixed-js', 'same', 'scoped', 'timetable'],
    t22, tt22 = [],
    t23, tt23 = []

var myObj = { num: 1, str: 'string', date: new Date(), bool: true, item: null },
    exprList = [
      '{ date }',
      '{ num === 0 ? 0 : num }',
      '<p>{str}</p>',
      ' "{ str[num].replace(/t/, "T") }" ',
      '{this.num}'
    ],
    csList = [
      '{ foo: num }',
      '{ foo: num, bar: item }',
      '{ foo: date.getFullYear() > 2015, bar: str === "string" }'
    ]

var files = tags.map(function (f) {
  f = path.join(basedir, f + '.tag')
  return fs.readFileSync(f, { encoding: 'utf8' })
})


var LOOP = 1500, EXPS = 10000, TMAX = 12, PAD = 12

console.log()
console.log('Testing each compiler with %d files, %dx%d iterations (%d total)',
  tags.length, TMAX-2, LOOP, tags.length * (TMAX-2) * LOOP)

console.log('Testing compiler v2.2.4 ...')
test(compiler22, tt22)
t22 = tt22.reduce(numsum)

console.log('Testing compiler v2.3.0 ...')
test(compiler23, tt23)
t23 = tt23.reduce(numsum)

console.log()
console.log('%s   Compiler 2.2.4   Compiler 2.3.0', padr('Results', PAD))
console.log('%s   --------------   --------------', replicate('-', PAD))
tags.forEach(function (f, n) {
  console.log('%s:  %s      %s', padr(f, PAD), padl(tt22[n], 10), padl(tt23[n], 10))
})
console.log('%s:  %s      %s', padr('TOTAL', PAD), padl(t22, 10), padl(t23, 10))

console.log()
console.log('Execution time of %d expressions & %d shorthands, %d iterations each',
  exprList.length, csList.length, (TMAX-2) * EXPS)

var ex22a, ex22b, ex23a, ex23b

console.log('tmpl v2.2.4 ...')
testExpr(tmpl22, myObj, tt22, exprList)
ex22a = tt22.reduce(numsum)
testExpr(tmpl22, myObj, tt22, csList)
ex22b = tt22.reduce(numsum)

console.log('tmpl v2.3.0 ...')
testExpr(tmpl23, myObj, tt23, exprList, false)
ex23a = tt23.reduce(numsum)
testExpr(tmpl23, myObj, tt23, csList, false)
ex23b = tt23.reduce(numsum)

console.log()
console.log('%s   tmpl 2.2.4   tmpl 2.3.0', padr('Results', PAD))
console.log('%s   ----------   ----------', replicate('-', PAD))
console.log('%s:  %s   %s', padr('Expressions', PAD), padl(ex22a, 10), padl(ex23a, 10))
console.log('%s:  %s   %s', padr('Shorthands',  PAD), padl(ex22b, 10), padl(ex23b, 10))
console.log('%s:  %s   %s', padr('TOTAL', PAD), padl(ex22a + ex22b, 10), padl(ex23a + ex23b, 10))
console.log()

console.log('compiler time for v2.3.0 includes compilation of expressions.')
console.log('both tmpl times excludes compilation.')
console.log('minimum & maximum times are removed in all tests.')

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

function testExpr(tmpl, data, times, list, v23) {

  times.length = 0
  list.forEach(function (expr, idx) {
    var tt = new Array(TMAX),
        s, i, j

    if (v23) expr = tmpl.parse(expr)    // explicit for v2.3
    else tmpl(expr, {})                 // auto

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
