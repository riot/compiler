/* eslint-disable */
// source: https://30secondsofcode.org/function#compose
export default (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)))