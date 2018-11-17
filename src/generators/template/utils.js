import {
  BINDING_EVALUATE_KEY,
  BINDING_INDEX_NAME_KEY,
  BINDING_ITEM_NAME_KEY,
  SCOPE
} from './constants'
import {builders, types} from '../../utils/build-types'
import {
  isBrowserAPI,
  isBuiltinAPI,
  isExpressionStatement,
  isIdentifier,
  isObjectExpression,
  isSequenceExpression,
  isThisExpression
} from '../../utils/ast-nodes-checks'
import compose from '../../utils/compose'
import createSourcemap from '../../utils/create-sourcemap'
import getLineAndColumnByPosition from '../../utils/get-line-and-column-by-position'
import panic from '../../utils/panic'
import recast from 'recast'

const scope = builders.identifier(SCOPE)
const getName = ({name}) => name


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
    inputSourceMap: sourceFile && createExpressionSourcemap(expression, sourceFile, sourceCode)
  })
}

const getEachItemName = expression => isSequenceExpression(expression) ? expression.expressions[0] : expression.left
const getEachIndexName = expression => isSequenceExpression(expression) ? expression.expressions[1].left : builders.litteral()
const getEachValue = expression => isSequenceExpression(expression) ? expression.expressions[1].right : expression.right

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
    builders.property(
      BINDING_ITEM_NAME_KEY,
      compose(builders.literal, getName, getEachItemName)(expression)
    ),
    builders.property(
      BINDING_INDEX_NAME_KEY,
      compose(builders.literal, getName, getEachIndexName)(expression)
    ),
    builders.property(
      BINDING_EVALUATE_KEY,
      compose(toScopedFunction, getEachValue)(expression)
    )
  ]
}

/**
 * Convert any parser option to a valid template one
 * @param   { DOMBindings.Expression|ASTNode } input - expression parsed by the riot parser or an AST tree
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
export function toScopedFunction(input, sourceFile, sourceCode) {
  const ast = input.text ? createASTFromExpression(input, sourceFile, sourceCode) : input
  const generatedAST = updateNodesScope(ast)
  const astBody = generatedAST.program.body
  const expressionAST = astBody[0].expression

  return builders.functionExpression(
    null,
    [builders.identifier(SCOPE)],
    builders.blockStatement([builders.returnStatement(
      expressionAST
    )])
  )
}