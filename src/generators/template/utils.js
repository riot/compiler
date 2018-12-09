import {
  BINDING_EVALUATE_KEY,
  BINDING_INDEX_NAME_KEY,
  BINDING_ITEM_NAME_KEY,
  BINDING_REDUNDANT_ATTRIBUTE_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_TEMPLATE_KEY,
  SCOPE,
  TEMPLATE_FN
} from './constants'
import {builders, types} from '../../utils/build-types'
import {
  isBrowserAPI,
  isBuiltinAPI,
  isExpressionStatement,
  isIdentifier,
  isLiteral,
  isObjectExpression,
  isSequenceExpression,
  isThisExpression
} from '../../utils/ast-nodes-checks'
import {nullNode, simplePropertyNode} from '../../utils/custom-ast-nodes'
import compose from '../../utils/compose'
import createSourcemap from '../../utils/create-sourcemap'
import getLineAndColumnByPosition from '../../utils/get-line-and-column-by-position'
import panic from '../../utils/panic'
import recast from 'recast'

const scope = builders.identifier(SCOPE)
const getName = node => node && node.name ? node.name : node

/**
 * Find the attribute node
 * @param   { riotParser.nodeTypes.TAG } node - a tag node
 * @param   { string } name -  name of the attribute we want to find
 * @returns { riotParser.nodeTypes.ATTR } attribute node
 */
export function findAttribute(node, name) {
  return node.attributes && node.attributes.find(attr => getName(attr) === name)
}

export function createExpressionSourcemap(expression, sourceFile, sourceCode) {
  const sourcemap = createSourcemap({ file: sourceFile })

  ;[expression.start, expression.end].forEach(position => {
    const location = getLineAndColumnByPosition(sourceCode, position)

    sourcemap.addMapping({
      source: sourceFile,
      generated: location,
      original: location
    })
  })
}

/**
 * Check if a node name is part of the browser or builtin javascript api or it belongs to the current scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns {boolean} true if it's a global api variable
 */
function isGlobal({ scope, node }) {
  return isBuiltinAPI(node) || isBrowserAPI(node) || scope.lookup(getName(node))
}

/**
 * Replace the path scope with a member Expression
 * @param   { types.NodePath } path - containing the current node visited
 * @param   { types.Node } property - node we want to prefix with the scope identifier
 * @returns {undefined} this is a void function
 */
function replacePathScope(path, property) {
  if (property) {
    path.replace(builders.memberExpression(
      scope,
      property,
      false
    ))
  } else {
    path.replace(scope)
  }
}

/**
 * Change the nodes scope adding the `scope` prefix
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 * @context { types.visit }
 */
function updateNodeScope(path) {
  if (!isGlobal(path)) {
    replacePathScope(path, isThisExpression(path.node.object) ? path.node.property : path.node)

    return false
  }

  this.traverse(path)
}

/**
 * Objects properties should be handled a bit differently from the Identifier
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 */
function visitProperty(path) {
  const value = path.node.value

  if (isIdentifier(value)) {
    updateNodeScope(path.get('value'))
  } else if (isObjectExpression(value)) {
    this.traverse(path.get('value'))
  }

  return false
}

/**
 * The this expressions should be replaced with the scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 */
function visitThisExpression(path) {
  path.replace(scope)
  this.traverse(path)
}

/**
 * Update the scope of the global nodes
 * @param   { Object } ast - ast program
 * @returns { Object } the ast program with all the global nodes updated
 */
export function updateNodesScope(ast) {
  const ignorePath = () => false

  types.visit(ast, {
    visitIdentifier: updateNodeScope,
    visitMemberExpression: updateNodeScope,
    visitProperty,
    visitThisExpression,
    visitClassExpression: ignorePath
  })

  return ast
}

/**
 * Convert any expression to an AST tree
 * @param   { Object } expression - expression parsed by the riot parser
 * @param   { string } sourceFile - original tag file
 * @param   { string } sourceCode - original tag source code
 * @returns { Object } the ast generated
 */
export function createASTFromExpression(expression, sourceFile, sourceCode) {
  return recast.parse(`(${expression.text})`, {
    sourceFileName: sourceFile,
    inputSourceMap: sourceFile && createExpressionSourcemap(expression, sourceFile, sourceCode)
  })
}

const getEachItemName = expression => isSequenceExpression(expression.left) ? expression.left.expressions[0] : expression.left
const getEachIndexName = expression => isSequenceExpression(expression.left) ? expression.left.expressions[1] : null
const getEachValue = expression => expression.right
const nameToliteral = compose(builders.literal, getName)

/**
 * Get the each expression properties to create properly the template binding
 * @param   { DomBinding.Expression } eachExpression - original each expression data
 * @param   { string } sourceFile - original tag file
 * @param   { string } sourceCode - original tag source code
 * @returns { Array } AST nodes that are needed to build an each binding
 */
export function getEachExpressionProperties(eachExpression, sourceFile, sourceCode) {
  const ast = createASTFromExpression(eachExpression, sourceFile, sourceCode)
  const body = ast.program.body
  const firstNode = body[0]


  if (!isExpressionStatement(firstNode)) {
    panic(`The each directives supported should be of type "ExpressionStatement",you have provided a "${firstNode.type}"`)
  }

  const { expression } = firstNode


  return [
    simplePropertyNode(
      BINDING_ITEM_NAME_KEY,
      compose(nameToliteral, getEachItemName)(expression)
    ),
    simplePropertyNode(
      BINDING_INDEX_NAME_KEY,
      compose(nameToliteral, getEachIndexName)(expression)
    ),
    simplePropertyNode(
      BINDING_EVALUATE_KEY,
      compose(
        e => toScopedFunction(e, sourceFile, sourceCode),
        e => ({
          ...eachExpression,
          text: recast.print(e).code
        }),
        getEachValue
      )(expression)
    )
  ]
}

/**
 * Create the bindings template property
 * @param   {Array} args - arguments to pass to the template function
 * @returns {ASTNode} a binding template key
 */
export function createTemplateProperty(args) {
  return simplePropertyNode(
    BINDING_TEMPLATE_KEY,
    args ? callTemplateFunction(...args) : nullNode()
  )
}

/**
 * Try to get the expression of an attribute node
 * @param   { RiotParser.Node.Attribute } attribute - riot parser attribute node
 * @returns { RiotParser.Node.Expression } attribute expression value
 */
export function getAttributeExpression(attribute) {
  return attribute.expressions ? attribute.expressions[0] : {
    // if no expression was found try to typecast the attribute value
    ...attribute,
    text: attribute.value
  }
}

/**
 * Convert any parser option to a valid template one
 * @param   { RiotParser.Node.Expression } expression - expression parsed by the riot parser
 * @param   { string } sourceFile - original tag file
 * @param   { string } sourceCode - original tag source code
 * @returns { Object } a FunctionExpression object
 *
 * @example
 *  toScopedFunction('foo + bar') // scope.foo + scope.bar
 *
 * @example
 *  toScopedFunction('foo.baz + bar') // scope.foo.baz + scope.bar
 */
export function toScopedFunction(expression, sourceFile, sourceCode) {
  const ast = createASTFromExpression(expression, sourceFile, sourceCode)
  const generatedAST = updateNodesScope(ast)
  const astBody = generatedAST.program.body
  const expressionAST = astBody[0] ? astBody[0].expression : astBody

  return builders.functionExpression(
    null,
    [builders.identifier(SCOPE)],
    builders.blockStatement([builders.returnStatement(
      expressionAST
    )])
  )
}

/**
 * Transform a template provided in different forms into a literal expression
 * @param   {Array|string|Node.Literal} template - template to transform into literal
 * @returns {Node.Literal} literal expression containing the template string
 */
export function templateToLiteral(template) {
  switch (true) {
  case isLiteral(template):
    return template
  case Array.isArray(template):
    return builders.literal(template.join(''))
  case typeof template === 'string':
    return builders.literal(template)
  default:
    return nullNode()
  }
}

/**
 * Create the template call function
 * @param   {Array|string|Node.Literal} template - template string
 * @param   {Array<AST.Nodes>} bindings - template bindings provided as AST nodes
 * @returns {Node.CallExpression} template call expression
 */
export function callTemplateFunction(template, bindings) {
  return builders.callExpression(builders.identifier(TEMPLATE_FN), [
    templateToLiteral(template),
    bindings ? bindings : nullNode()
  ])
}

/**
 * Convert any DOM attribute into a valid DOM selector useful for the querySelector API
 * @param   { string } attributeName - name of the attribute to query
 * @returns { string } the attribute transformed to a query selector
 */
export const attributeNameToDOMQuerySelector = attributeName => `[${attributeName}]`

/**
 * Create the properties to query a DOM node
 * @param   { string } attributeName - attribute name needed to identify a DOM node
 * @returns { Array<AST.Node> } array containing the selector properties needed for the binding
 */
export function createSelectorProperties(attributeName) {
  return [
    simplePropertyNode(BINDING_REDUNDANT_ATTRIBUTE_KEY, builders.literal(attributeName)),
    simplePropertyNode(BINDING_SELECTOR_KEY,
      compose(builders.literal, attributeNameToDOMQuerySelector)(attributeName)
    )
  ]
}
