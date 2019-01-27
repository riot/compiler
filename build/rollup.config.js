export default {
  input: './src/index.js',
  onwarn: function(error) {
    if (/external dependency|Circular dependency/.test(error.message)) return
    console.error(error.message) // eslint-disable-line
  },
  output: {
    banner: '/* Riot Compiler WIP, @license MIT */'
  }
}