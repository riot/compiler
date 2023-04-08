import commonjs from '@rollup/plugin-commonjs'
import defaultConfig from './rollup.config.js'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  ...defaultConfig,
  plugins: [
    json(),
    nodeResolve({
      extensions: ['.js', '.js', '.json'],
      modulesOnly: true,
    }),
    commonjs(),
  ],
  output: [
    {
      file: './dist/index.cjs',
      name: 'compiler',
      format: 'cjs',
      ...defaultConfig.output,
    },
    {
      file: './dist/index.js',
      format: 'esm',
      ...defaultConfig.output,
    },
  ],
}
