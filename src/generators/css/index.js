import composeSourcemaps from '../../utils/compose-sourcemaps'
import getPreprocessorTypeByAttribute from '../../utils/get-preprocessor-type-by-attribute'
import preprocess from '../../utils/preprocess-node'
import recast from 'recast'

const { types } = recast

/**
 * Generate the component css
 * @param   { Object } sourceNode - node generated by the riot compiler
 * @param   { string } source - original component source code
 * @param   { Object } options - user options
 * @param   { Object } output - current compiler output
 * @returns { Promise<Output> } - the current ast program and the original sourcemap
 */
export default async function css(sourceNode, source, options, { ast, map }) {
  const preprocessorName = getPreprocessorTypeByAttribute(sourceNode)
  const cssNode = sourceNode.text
  const preprocessorOutput = await preprocess('css', preprocessorName, options, source, cssNode)
  const generatedCss = recast.parse(`\`${preprocessorOutput.code}\``, {
    inputSourceMap: composeSourcemaps(map, preprocessorOutput.map)
  })

  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.name === 'css') {
        path.value.value = generatedCss.program.body[0].expression
        return false
      }

      this.traverse(path)
    }
  })

  return { ast, map, code: recast.print(ast).code }
}