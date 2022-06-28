module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    files: [
      '../node_modules/chai/chai.js',
      '../dist/compiler.js',
      'browser.spec.js'
    ]
  })
}
