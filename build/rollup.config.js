export default {
  input: './src/index.js',
  onwarn: function (error) {
    if (/external dependency|Circular dependency/.test(error.message)) return
    console.error(error.message)
  },
  output: {
    banner: '/* Riot Compiler, @license MIT */',
  },
}
