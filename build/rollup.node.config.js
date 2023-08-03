import commonjs from '@rollup/plugin-commonjs'
import defaultConfig from './rollup.config.js'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  ...defaultConfig,
  plugins: [
    // bundle only the json files
    json(),
    nodeResolve({
      extensions: ['.js', '.js', '.json'],
      // globals.json is the only file that we don't want to import
      resolveOnly: ['globals'],
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
