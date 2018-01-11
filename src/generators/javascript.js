/**
 * Generate the component javascript logic
 * @param   { Object } options - options needed to generate the javascript
 * @returns { Promise } output - async object output
 * @returns { Object } output.private - javascript that should be private placed on the top of our components
 * @returns { Object } output.public - javascript public logic that will be exported by the components
 */
export default function javascript(source, options) {
  return new Promise(resolve => {
    return resolve(source)
  })
}