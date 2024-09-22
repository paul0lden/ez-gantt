import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  jsx: true,
  type: 'lib',
  typescript: {
    overrides: {
      'ts/consistent-type-definitions': 'off',
    },
  },
  stylistic: true,
})
