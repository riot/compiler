import {browser, builtin} from 'globals'
import {builders, namedTypes, types} from '../../utils/build-types'
import {SCOPE} from './constants'
import createSourcemap from '../../utils/create-sourcemap'
import getLineAndColumnByPosition from '../../utils/get-line-and-column-by-position'
import recast from 'recast'


const isIdentifier = namedTypes.Identifier.check
const isObjectExpression = namedTypes.ObjectExpression.check
// const isArrowFunctionExpression = namedTypes.ArrowFunctionExpression.check


const browserAPIs = Object.keys(browser)
const builtinAPIs = Object.keys(builtin)

/**
 * Find the attribute node
 * @param   { riotParser.nodeTypes.TAG } node - a tag node
 * @param   { string } name -  name of the attribute we want to find
 * @returns { riotParser.nodeTypes.ATTR } attribute node
 */
export function findAttribute(node, name) {
  return node.attributes && node.attributes.find(attr => attr.name = name)
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
 * Check if a node name is part of the browser or builtin javascript api
 * @param   {string}  options.name - name of the node to check
 * @returns {boolean} true if it's a global api method
 */
function isGlobalAPI({ name }) {
  return browserAPIs.includes(name) || builtinAPIs.includes(name)
}

/**
 * Change the nodes scope adding the `scope` prefix
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 * @context { types.visit }
 */
function updateNodeScope(path) {
  if (path.scope.isGlobal && !isGlobalAPI(path.node)) {
    path.replace(builders.memberExpression(
      builders.identifier(SCOPE),
      path.node,
      false
    ))

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
    visitClassExpression: ignorePath
  })

  return ast
}

/**
 * Convert any parser option to a valid template one
 * @param   { Object } expression - expression parsed by the riot parser
 * @param   { string } sourceFile - original tag file
 * @param   { string } sourceCode - original tag source code
 * @returns { Object } a FunctionExpression object
 *
 * @example
 *  expressionToScopedFunction('foo + bar') // scope.foo + scope.bar
 *
  * @example
 *  expressionToScopedFunction('foo.baz + bar') // scope.foo.baz + scope.bar
 */
export function expressionToScopedFunction(expression, sourceFile, sourceCode) {
  const ast = recast.parse(`(${expression.text})`, {
    inputSourceMap: sourceFile && createExpressionSourcemap(expression, sourceFile, sourceCode)
  })

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
