import {builders, types} from '../../utils/build-types'
import {SCOPE} from './constants'
import createSourcemap from '../../utils/create-sourcemap'
import getLineAndColumnByPosition from '../../utils/get-line-and-column-by-position'
import recast from 'recast'

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
 * Change the nodes scope adding the `scope` prefix
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 * @context { types.visit }
 */
function updateNodeScope(path) {
  if (path.scope.isGlobal) {
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
 * Update the scope of the global nodes
 * @param   { Object } ast - ast program
 * @returns { Object } the ast program with all the global nodes updated
 */
export function updateNodesScope(ast) {
  const ingoreNode = () => false

  types.visit(ast, {
    visitIdentifier: updateNodeScope,
    visitMemberExpression: updateNodeScope,
    visitProperty: ingoreNode
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
    inputSourceMap: createExpressionSourcemap(expression, sourceFile, sourceCode)
  })

  return builders.functionExpression(
    null,
    [builders.identifier(SCOPE)],
    builders.returnStatement(
      updateNodesScope(ast).program.body[0].expression
    )
  )
}
