import { defineConfig } from 'eslint/config'
import riotEslintConfig from 'eslint-config-riot'

export default defineConfig([
  { extends: [riotEslintConfig] },
  {
    rules: {
      'fp/no-mutating-methods': 0,
      'jsdoc/no-undefined-types': 0,
    },
  },
])
