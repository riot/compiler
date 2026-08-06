import { defineConfig } from 'eslint/config'
import riotEslintConfig from 'eslint-config-riot'

export default defineConfig([
  {
    ignores: [
      '**/coverage/',
      '**/dist/',
      '**/test/expected/',
      '**/test/fixtures/',
      'src/utils/ast-nodes-checks.js',
      'src/utils/html-entities/encode.js',
    ],
  },
  { extends: [riotEslintConfig] },
  {
    rules: {
      'fp/no-mutating-methods': 0,
      'jsdoc/no-undefined-types': 0,
    },
  },
])
