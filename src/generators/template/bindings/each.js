import {
  BINDING_CONDITION_KEY,
  BINDING_EVALUATE_KEY,
  BINDING_GET_KEY_KEY,
  BINDING_INDEX_NAME_KEY,
  BINDING_ITEM_NAME_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  EACH_BINDING_TYPE
} from '../constants'
import {
  createASTFromExpression,
  createSelectorProperties,
  createTemplateProperty,
  getAttributeExpression,
  getName,
  toScopedFunction
} from '../utils'
import {findEachAttribute, findIfAttribute, findKeyAttribute} from '../find'
import {isExpressionStatement, isSequenceExpression} from '../../../utils/ast-nodes-checks'
import {nullNode, simplePropertyNode} from '../../../utils/custom-ast-nodes'
import {builders} from '../../../utils/build-types'
import compose from 'cumpa'
import {createNestedBindings} from '../builder'
import generateJavascript from '../../../utils/generate-javascript'
import {panic} from '@riotjs/util/misc'

const getEachItemName = expression => isSequenceExpression(expression.left) ? expression.left.expressions[0] : expression.left
const getEachIndexName = expression => isSequenceExpression(expression.left) ? expression.left.expressions[1] : null
const getEachValue = expression => expression.right
const nameToliteral = compose(builders.literal, getName)

const generateEachItemNameKey = expression => simplePropertyNode(
  BINDING_ITEM_NAME_KEY,
  compose(nameToliteral, getEachItemName)(expression)
)

const generateEachIndexNameKey = expression => simplePropertyNode(
  BINDING_INDEX_NAME_KEY,
  compose(nameToliteral, getEachIndexName)(expression)
)

const generateEachEvaluateKey = (expression, eachExpression, sourceFile, sourceCode) => simplePropertyNode(
  BINDING_EVALUATE_KEY,
  compose(
    e => toScopedFunction(e, sourceFile, sourceCode),
    e => ({
      ...eachExpression,
      text: generateJavascript(e).code
    }),
    getEachValue
  )(expression)
)

/**
 * Get the each expression properties to create properly the template binding
 * @param   { DomBinding.Expression } eachExpression - original each expression data
 * @param   { string } sourceFile - original tag file
 * @param   { string } sourceCode - original tag source code
 * @returns { Array } AST nodes that are needed to build an each binding
 */
export function generateEachExpressionProperties(eachExpression, sourceFile, sourceCode) {
  const ast = createASTFromExpression(eachExpression, sourceFile, sourceCode)
  const body = ast.program.body
  const firstNode = body[0]

  if (!isExpressionStatement(firstNode)) {
    panic(`The each directives supported should be of type "ExpressionStatement",you have provided a "${firstNode.type}"`)
  }

  const { expression } = firstNode

  return [
    generateEachItemNameKey(expression),
    generateEachIndexNameKey(expression),
    generateEachEvaluateKey(expression, eachExpression, sourceFile, sourceCode)
  ]
}

/**
 * Transform a RiotParser.Node.Tag into an each binding
 * @param   { RiotParser.Node.Tag } sourceNode - tag containing the each attribute
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createEachBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  const [ifAttribute, eachAttribute, keyAttribute] = [
    findIfAttribute,
    findEachAttribute,
    findKeyAttribute
  ].map(f => f(sourceNode))
  const attributeOrNull = attribute => attribute ? toScopedFunction(getAttributeExpression(attribute), sourceFile, sourceCode) : nullNode()

  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(EACH_BINDING_TYPE),
        false
      )
    ),
    simplePropertyNode(BINDING_GET_KEY_KEY, attributeOrNull(keyAttribute)),
    simplePropertyNode(BINDING_CONDITION_KEY, attributeOrNull(ifAttribute)),
    createTemplateProperty(createNestedBindings(sourceNode, sourceFile, sourceCode, selectorAttribute)),
    ...createSelectorProperties(selectorAttribute),
    ...compose(generateEachExpressionProperties, getAttributeExpression)(eachAttribute)
  ])
}
