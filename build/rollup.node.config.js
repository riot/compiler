import commonjs from 'rollup-plugin-commonjs'
import defaultConfig from './rollup.config'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  ...defaultConfig,
  plugins: [
    nodeResolve({
      modulesOnly: true
    }),
    commonjs()
  ],
  output: [{
    file: './dist/index.js',
    name: 'compiler',
    format: 'cjs',
    ...defaultConfig.output
  }, {
    file: './dist/index.esm.js',
    format: 'esm',
    ...defaultConfig.output
  }]
}