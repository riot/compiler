import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import defaultConfig from './rollup.config.js'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'node:path'

const ignoredModules = ['fs', 'path', 'esprima', 'babylon']
const emptyFile = 'export default undefined'

// ignore builtin requires
function ignore() {
  return {
    transform(code, id) {
      if (!id.includes('commonjs-external')) return

      return {
        code: emptyFile,
        map: null,
      }
    },
  }
}

export default ['umd', 'esm'].map((format) => ({
  ...defaultConfig,
  output: {
    name: 'compiler',
    file: `./dist/compiler.essential${format === 'esm' ? '.js' : '.cjs'}`,
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
    ignore(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),
    json({
      namedExports: true,
      preferConst: true,
    }),
    alias({
      entries: [
        {
          find: 'source-map',
          replacement: path.resolve('./src/utils/mock/sourcemap-mock-api.js'),
        },
        {
          find: 'assert',
          replacement: path.resolve('./src/utils/mock/assert-mock-api.js'),
        },
        {
          find: 'os',
          replacement: path.resolve('./src/utils/mock/os-mock-api.js'),
        },
        {
          find: 'recast/parsers/typescript.js',
          replacement: 'recast/parsers/acorn.js',
        },
      ],
    }),
    nodeResolve({
      extensions: ['.js', '.json'],
      browser: true,
    }),
    commonjs({
      include: 'node_modules/**',
      transformMixedEsModules: true,
      ignoreTryCatch: false,
      ignoreDynamicRequires: true,
      exclude: ignoredModules,
      ignoreGlobal: true,
    }),
    format === 'esm' ? visualizer() : null,
  ],
}))
