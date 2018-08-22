import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  output: {
    banner: '/* Riot Compiler WIP, @license MIT */',
    name: 'compiler'
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
      ignoreGlobal: true
    })
  ]
}