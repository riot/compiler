import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import defaultConfig from './rollup.config.js'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  ...defaultConfig,
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),
    // bundle only the json files
    json(),
    nodeResolve({
      extensions: ['.js', '.json'],
      // bundle only the node modules that are problematic
      resolveOnly: ['globals', 'string-indexes', 'css-simple-parser'],
    }),
    commonjs(),
  ],
  output: [
    {
      file: './dist/index.cjs',
      name: 'compiler',
      format: 'cjs',
      interop: 'auto',
      ...defaultConfig.output,
    },
    {
      file: './dist/index.js',
      format: 'esm',
      ...defaultConfig.output,
    },
  ],
}
