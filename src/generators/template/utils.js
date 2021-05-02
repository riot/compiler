import {
  BINDING_REDUNDANT_ATTRIBUTE_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_SELECTOR_PREFIX,
  BINDING_TEMPLATE_KEY,
  EACH_DIRECTIVE,
  IF_DIRECTIVE,
  IS_BOOLEAN_ATTRIBUTE,
  IS_DIRECTIVE,
  KEY_ATTRIBUTE,
  SCOPE,
  SLOT_ATTRIBUTE,
  TEMPLATE_FN,
  TEXT_NODE_EXPRESSION_PLACEHOLDER
} from './constants'
import {builders, types} from '../../utils/build-types'
import {findIsAttribute, findStaticAttributes} from './find'
import {
  hasExpressions,
  isGlobal,
  isTagNode,
  isTextNode,
  isVoidNode
} from './checks'
import {
  isIdentifier,
  isLiteral,
  isMemberExpression
} from '../../utils/ast-nodes-checks'
import {nullNode, simplePropertyNode} from '../../utils/custom-ast-nodes'
import addLinesOffset from '../../utils/add-lines-offset'
import compose from 'cumpa'
import {createExpression} from './expressions/index'
import encodeHTMLEntities from '../../utils/html-entities/encode'
import generateAST from '../../utils/generate-ast'
import unescapeChar from '../../utils/unescape-char'

const scope = builders.identifier(SCOPE)
export const getName = node => node && node.name ? node.name : node

/**
 * Replace the path scope with a member Expression
 * @param   { types.NodePath } path - containing the current node visited
 * @param   { types.Node } property - node we want to prefix with the scope identifier
 * @returns {undefined} this is a void function
 */
function replacePathScope(path, property) {
  path.replace(builders.memberExpression(
    scope,
    property,
    false
  ))
}

/**
 * Change the nodes scope adding the `scope` prefix
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 * @context { types.visit }
 */
function updateNodeScope(path) {
  if (!isGlobal(path)) {
    replacePathScope(path, path.node)

    return false
  }

  this.traverse(path)
}

/**
 * Change the scope of the member expressions
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return always false because we want to check only the first node object
 */
function visitMemberExpression(path) {
  const traversePathObject = () => this.traverse(path.get('object'))
  const currentObject = path.node.object

  switch (true) {
  case isGlobal(path):
    if (currentObject.arguments && currentObject.arguments.length) {
      traversePathObject()
    }
    break
  case !path.value.computed && isIdentifier(currentObject):
    replacePathScope(
      path,
      path.node
    )
    break
  default:
    this.traverse(path)
  }

  return false
}

/**
 * Objects properties should be handled a bit differently from the Identifier
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean } return false if we want to stop the tree traversal
 */
function visitObjectProperty(path) {
  const value = path.node.value
  const isShorthand = path.node.shorthand

  if (isIdentifier(value) || isMemberExpression(value) || isShorthand) {
    // disable shorthand object properties
    if (isShorthand) path.node.shorthand = false

    updateNodeScope.call(this, path.get('value'))
  } else {
    this.traverse(path.get('value'))
  }

  return false
}

/**
 * The this expressions should be replaced with the scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean|undefined } return false if we want to stop the tree traversal
 */
function visitThisExpression(path) {
  path.replace(scope)
  this.traverse(path)
}

/**
 * Replace the identifiers with the node scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns { boolean|undefined } return false if we want to stop the tree traversal
 */
function visitIdentifier(path) {
  const parentValue = path.parent.value

  if (!isMemberExpression(parentValue) || parentValue.computed) {
    updateNodeScope.call(this, path)
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
    visitIdentifier,
    visitMemberExpression,
    visitObjectProperty,
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
  const code = sourceFile ?
    addLinesOffset(expression.text, sourceCode, expression) :
    expression.text

  return generateAST(`(${code})`, {
    sourceFileName: sourceFile
  })
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
 * Wrap the ast generated in a function call providing the scope argument
 * @param   {Object} ast - function body
 * @returns {FunctionExpresion} function having the scope argument injected
 */
export function wrapASTInFunctionWithScope(ast) {
  return builders.functionExpression(
    null,
    [scope],
    builders.blockStatement([builders.returnStatement(
      ast
    )])
  )
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
  return compose(
    wrapASTInFunctionWithScope,
    transformExpression
  )(expression, sourceFile, sourceCode)
}

/**
 * Transform an expression node updating its global scope
 * @param   {RiotParser.Node.Expr} expression - riot parser expression node
 * @param   {string} sourceFile - source file
 * @param   {string} sourceCode - source code
 * @returns {ASTExpression} ast expression generated from the riot parser expression node
 */
export function transformExpression(expression, sourceFile, sourceCode) {
  return compose(
    getExpressionAST,
    updateNodesScope,
    createASTFromExpression
  )(expression, sourceFile, sourceCode)
}

/**
 * Get the parsed AST expression of riot expression node
 * @param   {AST.Program} sourceAST - raw node parsed
 * @returns {AST.Expression} program expression output
 */
export function getExpressionAST(sourceAST) {
  const astBody = sourceAST.program.body

  return astBody[0] ? astBody[0].expression : astBody
}

/**
 * Create the template call function
 * @param   {Array|string|Node.Literal} template - template string
 * @param   {Array<AST.Nodes>} bindings - template bindings provided as AST nodes
 * @returns {Node.CallExpression} template call expression
 */
export function callTemplateFunction(template, bindings) {
  return builders.callExpression(builders.identifier(TEMPLATE_FN), [
    template ? builders.literal(template) : nullNode(),
    bindings ? builders.arrayExpression(bindings) : nullNode()
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
  return attributeName ? [
    simplePropertyNode(BINDING_REDUNDANT_ATTRIBUTE_KEY, builders.literal(attributeName)),
    simplePropertyNode(BINDING_SELECTOR_KEY,
      compose(builders.literal, attributeNameToDOMQuerySelector)(attributeName)
    )
  ] : []
}

/**
 * Clone the node filtering out the selector attribute from the attributes list
 * @param   {RiotParser.Node} node - riot parser node
 * @param   {string} selectorAttribute - name of the selector attribute to filter out
 * @returns {RiotParser.Node} the node with the attribute cleaned up
 */
export function cloneNodeWithoutSelectorAttribute(node, selectorAttribute) {
  return {
    ...node,
    attributes: getAttributesWithoutSelector(getNodeAttributes(node), selectorAttribute)
  }
}


/**
 * Get the node attributes without the selector one
 * @param   {Array<RiotParser.Attr>} attributes - attributes list
 * @param   {string} selectorAttribute - name of the selector attribute to filter out
 * @returns {Array<RiotParser.Attr>} filtered attributes
 */
export function getAttributesWithoutSelector(attributes, selectorAttribute) {
  if (selectorAttribute)
    return attributes.filter(attribute => attribute.name !== selectorAttribute)

  return attributes
}

/**
 * Clean binding or custom attributes
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {Array<RiotParser.Node.Attr>} only the attributes that are not bindings or directives
 */
export function cleanAttributes(node) {
  return getNodeAttributes(node).filter(attribute => ![
    IF_DIRECTIVE,
    EACH_DIRECTIVE,
    KEY_ATTRIBUTE,
    SLOT_ATTRIBUTE,
    IS_DIRECTIVE
  ].includes(attribute.name))
}

/**
 * Root node factory function needed for the top root nodes and the nested ones
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {RiotParser.Node} root node
 */
export function rootNodeFactory(node) {
  return {
    nodes: getChildrenNodes(node),
    isRoot: true
  }
}

/**
 * Create a root node proxing only its nodes and attributes
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {RiotParser.Node} root node
 */
export function createRootNode(node) {
  return {
    ...rootNodeFactory(node),
    attributes: compose(
      // root nodes should always have attribute expressions
      transformStatiAttributesIntoExpressions,
      // root nodes shuold't have directives
      cleanAttributes
    )(node)
  }
}

/**
 * Create nested root node. Each and If directives create nested root nodes for example
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {RiotParser.Node} root node
 */
export function createNestedRootNode(node) {
  return {
    ...rootNodeFactory(node),
    attributes: cleanAttributes(node)
  }
}

/**
 * Transform the static node attributes into expressions, useful for the root nodes
 * @param   {Array<RiotParser.Node.Attr>} attributes - riot parser node
 * @returns {Array<RiotParser.Node.Attr>} all the attributes received as attribute expressions
 */
export function transformStatiAttributesIntoExpressions(attributes) {
  return attributes.map(attribute => {
    if (attribute.expressions) return attribute

    return {
      ...attribute,
      expressions: [{
        start: attribute.valueStart,
        end: attribute.end,
        text: `'${attribute.value || attribute.name}'`
      }]
    }
  })
}

/**
 * Get all the child nodes of a RiotParser.Node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {Array<RiotParser.Node>} all the child nodes found
 */
export function getChildrenNodes(node) {
  return node && node.nodes ? node.nodes : []
}

/**
 * Get all the attributes of a riot parser node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {Array<RiotParser.Node.Attribute>} all the attributes find
 */
export function getNodeAttributes(node) {
  return node.attributes ? node.attributes : []
}

/**
 * Get the name of a custom node transforming it into an expression node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {RiotParser.Node.Attr} the node name as expression attribute
 */
export function getCustomNodeNameAsExpression(node) {
  const isAttribute = findIsAttribute(node)
  const toRawString = val => `'${val}'`

  if (isAttribute) {
    return isAttribute.expressions ? isAttribute.expressions[0] : {
      ...isAttribute,
      text: toRawString(isAttribute.value)
    }
  }

  return { ...node, text: toRawString(getName(node)) }
}

/**
 * Convert all the node static attributes to strings
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {string} all the node static concatenated as string
 */
export function staticAttributesToString(node) {
  return findStaticAttributes(node)
    .map(attribute => attribute[IS_BOOLEAN_ATTRIBUTE] || !attribute.value ?
      attribute.name :
      `${attribute.name}="${unescapeNode(attribute, 'value').value}"`
    ).join(' ')
}

/**
 * Make sure that node escaped chars will be unescaped
 * @param   {RiotParser.Node} node - riot parser node
 * @param   {string} key - key property to unescape
 * @returns {RiotParser.Node} node with the text property unescaped
 */
export function unescapeNode(node, key) {
  if (node.unescape) {
    return {
      ...node,
      [key]: unescapeChar(node[key], node.unescape)
    }
  }

  return node
}

/**
 * Convert a riot parser opening node into a string
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {string} the node as string
 */
export function nodeToString(node) {
  const attributes = staticAttributesToString(node)

  switch (true) {
  case isTagNode(node):
    return `<${node.name}${attributes ? ` ${attributes}` : ''}${isVoidNode(node) ? '/' : ''}>`
  case isTextNode(node):
    return hasExpressions(node) ? TEXT_NODE_EXPRESSION_PLACEHOLDER : unescapeNode(node, 'text').text
  default:
    return node.text || ''
  }
}

/**
 * Close an html node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {string} the closing tag of the html tag node passed to this function
 */
export function closeTag(node) {
  return node.name ? `</${node.name}>` : ''
}

/**
 * Create a strings array with the `join` call to transform it into a string
 * @param   {Array} stringsArray - array containing all the strings to concatenate
 * @returns {AST.CallExpression} array with a `join` call
 */
export function createArrayString(stringsArray) {
  return builders.callExpression(
    builders.memberExpression(
      builders.arrayExpression(stringsArray),
      builders.identifier('join'),
      false
    ),
    [builders.literal('')]
  )
}

/**
 * Simple expression bindings might contain multiple expressions like for example: "class="{foo} red {bar}""
 * This helper aims to merge them in a template literal if it's necessary
 * @param   {RiotParser.Attr} node - riot parser node
 * @param   {string} sourceFile - original tag file
 * @param   {string} sourceCode - original tag source code
 * @returns { Object } a template literal expression object
 */
export function mergeAttributeExpressions(node, sourceFile, sourceCode) {
  if (!node.parts || node.parts.length === 1) {
    return transformExpression(node.expressions[0], sourceFile, sourceCode)
  }
  const stringsArray = [
    ...node.parts.reduce((acc, str) => {
      const expression = node.expressions.find(e => e.text.trim() === str)

      return [
        ...acc,
        expression ?
          transformExpression(expression, sourceFile, sourceCode) :
          builders.literal(encodeHTMLEntities(str))
      ]
    }, [])
  ].filter(expr => !isLiteral(expr) || expr.value)


  return createArrayString(stringsArray)
}

/**
 * Create a selector that will be used to find the node via dom-bindings
 * @param   {number} id - temporary variable that will be increased anytime this function will be called
 * @returns {string} selector attribute needed to bind a riot expression
 */
export const createBindingSelector = (function createSelector(id = 0) {
  return () => `${BINDING_SELECTOR_PREFIX}${id++}`
}())

/**
 * Create the AST array containing the attributes to bind to this node
 * @param   { RiotParser.Node.Tag } sourceNode - the custom tag
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { string } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns {AST.ArrayExpression} array containing the slot objects
 */
export function createBindingAttributes(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  return builders.arrayExpression([
    ...compose(
      attributes => attributes.map(attribute => createExpression(attribute, sourceFile, sourceCode, 0, sourceNode)),
      attributes => attributes.filter(hasExpressions),
      attributes => getAttributesWithoutSelector(attributes, selectorAttribute),
      cleanAttributes
    )(sourceNode)
  ])
}

/**
 * Create an attribute evaluation function
 * @param   {RiotParser.Attr} sourceNode - riot parser node
 * @param   {string} sourceFile - original tag file
 * @param   {string} sourceCode - original tag source code
 * @returns { AST.Node } an AST function expression to evaluate the attribute value
 */
export function createAttributeEvaluationFunction(sourceNode, sourceFile, sourceCode) {
  return hasExpressions(sourceNode) ?
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
}
