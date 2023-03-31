import {
  callTemplateFunction,
  createRootNode,
  createTemplateDependenciesInjectionWrapper,
} from './utils.mjs'
import { TAG_TEMPLATE_PROPERTY } from '../../constants.mjs'
import build from './builder.mjs'
import { types } from '../../utils/build-types.mjs'

/**
 * Create the content of the template function
 * @param   { RiotParser.Node } sourceNode - node generated by the riot compiler
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns {AST.BlockStatement} the content of the template function
 */
function createTemplateFunctionContent(sourceNode, sourceFile, sourceCode) {
  return callTemplateFunction(
    ...build(createRootNode(sourceNode), sourceFile, sourceCode),
  )
}

/**
 * Extend the AST adding the new template property containing our template call to render the component
 * @param   { Object } ast - current output ast
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @param   { RiotParser.Node } sourceNode - node generated by the riot compiler
 * @returns { Object } the output ast having the "template" key
 */
function extendTemplateProperty(ast, sourceFile, sourceCode, sourceNode) {
  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.name === TAG_TEMPLATE_PROPERTY) {
        path.value.value = createTemplateDependenciesInjectionWrapper(
          createTemplateFunctionContent(sourceNode, sourceFile, sourceCode),
        )

        return false
      }

      this.traverse(path)
    },
  })

  return ast
}

/**
 * Generate the component template logic
 * @param   { RiotParser.Node } sourceNode - node generated by the riot compiler
 * @param   { string } source - original component source code
 * @param   { Object } meta - compilation meta information
 * @param   { AST } ast - current AST output
 * @returns { AST } the AST generated
 */
export default function template(sourceNode, source, meta, ast) {
  const { options } = meta
  return extendTemplateProperty(ast, options.file, source, sourceNode)
}