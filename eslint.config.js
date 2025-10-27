import vuetify from 'eslint-config-vuetify'
import tsParser from '@typescript-eslint/parser'

export default [
  ...vuetify(),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  }
]
