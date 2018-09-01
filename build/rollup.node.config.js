import defaultConfig from './rollup.config'

export default {
  ...defaultConfig,
  output: [{
    file: './dist/index.js',
    format: 'cjs',
    ...defaultConfig.output
  }, {
    file: './dist/index.esm.js',
    format: 'esm',
    ...defaultConfig.output
  }]
}