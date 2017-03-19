import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  moduleName: 'compiler',
  banner: '/* Riot Compiler WIP, @license MIT */',
  plugins: [
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
      ignoreGlobal: true
    })
  ]
}