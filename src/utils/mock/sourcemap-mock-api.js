// mock the sourcemaps api for the browser bundle
// we do not need sourcemaps with the in browser compilation
const noop = function () {}

export const SourceMapGenerator = function () {
  return {
    addMapping: noop,
    setSourceContent: noop,
    toJSON: () => ({}),
  }
}
export const SourceMapConsumer = function () {}
export const SourceNode = function () {}

export default {
  SourceNode,
  SourceMapConsumer,
  SourceMapGenerator,
}
