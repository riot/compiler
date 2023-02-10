import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import defaultConfig from './rollup.config'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import { visualizer } from 'rollup-plugin-visualizer'

const ignoredModules = ['fs', 'path', 'esprima']

export default ['umd', 'esm'].map((format) => ({
  ...defaultConfig,
  output: {
    name: 'compiler',
    file: `./dist/compiler.essential${format === 'umd' ? '' : `.${format}`}.js`,
    format: format,
    globals: ignoredModules.reduce(
      (acc, dep) => ({
        [dep]: dep,
        ...acc,
      }),
      {},
    ),
    ...defaultConfig.output,
  },
  external: ignoredModules.concat(format === 'esm' ? [/@riotjs\/(util)/] : []),
  plugins: [
    json({
      namedExports: true,
      preferConst: true,
    }),
    alias({
      entries: [
        {
          find: 'source-map',
          replacement: './src/utils/mock/sourcemap-mock-api.js',
        },
        {
          find: 'assert',
          replacement: './src/utils/mock/assert-mock-api.js',
        },
        {
          find: 'os',
          replacement: './src/utils/mock/os-mock-api.js',
        },
        {
          find: 'recast/parsers/typescript',
          replacement: 'recast/parsers/acorn',
        },
      ],
    }),
    nodeResolve({
      browser: true,
    }),
    commonjs({
      include: 'node_modules/**',
      ignoreTryCatch: false,
      ignoreDynamicRequires: true,
      ignore: format === 'esm' ? ignoredModules : null,
      exclude: ignoredModules,
      ignoreGlobal: true,
    }),
    format === 'esm' ? visualizer() : null,
  ],
}))
