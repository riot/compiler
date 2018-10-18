import alias from 'rollup-plugin-alias'
import builtins from 'rollup-plugin-node-builtins'
import commonjs from 'rollup-plugin-commonjs'
import defaultConfig from './rollup.config'
import nodeResolve from 'rollup-plugin-node-resolve'
import { resolve } from 'path'

const sourcemapPath = resolve('./node_modules/source-map/dist/source-map')
const ignredModules = ['fs', 'path']

export default {
  ...defaultConfig,
  output: {
    name: 'compiler',
    file: './dist/compiler.js',
    format: 'umd',
    globals: ignredModules,
    ...defaultConfig.output
  },
  external: ignredModules,
  plugins: [
    builtins(),
    alias({
      'source-map': sourcemapPath
    }),
    nodeResolve({
      browser: true
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        [sourcemapPath]: ['SourceMapGenerator', 'SourceMapConsumer']
      },
      ignoreGlobal: true
    })
  ]
}