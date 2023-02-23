import commonjs from '@rollup/plugin-commonjs'
import defaultConfig from './rollup.config.mjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  ...defaultConfig,
  plugins: [
    json(),
    nodeResolve({
      modulesOnly: true,
    }),
    commonjs(),
  ],
  output: [
    {
      file: './dist/index.js',
      name: 'compiler',
      format: 'cjs',
      ...defaultConfig.output,
    },
    {
      file: './dist/index.esm.js',
      format: 'esm',
      ...defaultConfig.output,
    },
  ],
}
