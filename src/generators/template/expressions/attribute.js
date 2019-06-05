import {
  ATTRIBUTE_EXPRESSION_TYPE,
  BINDING_EVALUATE_KEY,
  BINDING_NAME_KEY,
  BINDING_TYPE_KEY,
  EXPRESSION_TYPES
} from '../constants'
import {createArrayString, hasExpressions, isSpreadAttribute, transformExpression, wrapASTInFunctionWithScope} from '../utils'
import {nullNode, simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {builders} from '../../../utils/build-types'
import {isLiteral} from '../../../utils/ast-nodes-checks'


/**
 * Simple expression bindings might contain multiple expressions like for example: "class="{foo} red {bar}""
 * This helper aims to merge them in a template literal if it's necessary
 * @param   {RiotParser.Attr} node - riot parser node
 * @param   {string} sourceFile - original tag file
 * @param   {string} sourceCode - original tag source code
 * @returns { Object } a template literal expression object
 */
export function mergeAttributeExpressions(node, sourceFile, sourceCode) {
  if (!node.parts || node.parts.length === 1)
    return transformExpression(node.expressions[0], sourceFile, sourceCode)
  const stringsArray = [
    ...node.parts.reduce((acc, str) => {
      const expression = node.expressions.find(e => e.text.trim() === str)

      return [
        ...acc,
        expression ? transformExpression(expression, sourceFile, sourceCode) : builders.literal(str)
      ]
    }, [])
  ].filter(expr => !isLiteral(expr) || expr.value)


  return createArrayString(stringsArray)
}

/**
 * Create a simple attribute expression
 * @param   {RiotParser.Node.Attr} sourceNode - the custom tag
 * @param   {string} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} object containing the expression binding keys
 */
export default function createAttributeExpression(sourceNode, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(EXPRESSION_TYPES),
        builders.identifier(ATTRIBUTE_EXPRESSION_TYPE),
        false
      ),
    ),
    simplePropertyNode(BINDING_NAME_KEY, isSpreadAttribute(sourceNode) ? nullNode() : builders.literal(sourceNode.name)),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      hasExpressions(sourceNode) ?
        // dynamic attribute
        wrapASTInFunctionWithScope(mergeAttributeExpressions(sourceNode, sourceFile, sourceCode)) :
        // static attribute
        builders.functionExpression(
          null,
          [],
          builders.blockStatement([
            builders.returnStatement(builders.literal(sourceNode.value || true))
          ])
        )
    )
  ])
}