import {
  BINDING_REDUNDANT_ATTRIBUTE_KEY,
  BINDING_SELECTOR_KEY,
  BINDING_SELECTOR_PREFIX,
  BINDING_TEMPLATE_KEY,
  EACH_DIRECTIVE,
  IF_DIRECTIVE,
  IS_BOOLEAN_ATTRIBUTE,
  IS_CUSTOM_NODE,
  IS_DIRECTIVE,
  IS_SPREAD_ATTRIBUTE,
  IS_VOID_NODE,
  KEY_ATTRIBUTE,
  SCOPE,
  SLOT_ATTRIBUTE,
  SLOT_TAG_NODE_NAME,
  TEMPLATE_FN,
  TEXT_NODE_EXPRESSION_PLACEHOLDER
} from './constants'
import {builders, types} from '../../utils/build-types'
import {
  isBinaryExpression,
  isBrowserAPI,
  isBuiltinAPI,
  isIdentifier,
  isRaw,
  isThisExpression
} from '../../utils/ast-nodes-checks'
import {nullNode, simplePropertyNode} from '../../utils/custom-ast-nodes'
import addLinesOffset from '../../utils/add-lines-offset'
import compose from 'cumpa'
import curry from 'curri'
import generateAST from '../../utils/generate-ast'
import {nodeTypes} from '@riotjs/parser'
import unescapeChar from '../../utils/unescape-char'

const scope = builders.identifier(SCOPE)
export const getName = node => node && node.name ? node.name : node

/**
 * Find the attribute node
 * @param   { string } name -  name of the attribute we want to find
 * @param   { riotParser.nodeTypes.TAG } node - a tag node
 * @returns { riotParser.nodeTypes.ATTR } attribute node
 */
export function findAttribute(name, node) {
  return node.attributes && node.attributes.find(attr => getName(attr) === name)
}

export const findIfAttribute = curry(findAttribute)(IF_DIRECTIVE)
export const findEachAttribute = curry(findAttribute)(EACH_DIRECTIVE)
export const findKeyAttribute = curry(findAttribute)(KEY_ATTRIBUTE)
export const findIsAttribute = curry(findAttribute)(IS_DIRECTIVE)
export const hasIfAttribute = compose(Boolean, findIfAttribute)
export const hasEachAttribute = compose(Boolean, findEachAttribute)
export const hasKeyAttribute = compose(Boolean, findKeyAttribute)
export const hasIsAttribute = compose(Boolean, findIsAttribute)

/**
 * Check if a node name is part of the browser or builtin javascript api or it belongs to the current scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns {boolean} true if it's a global api variable
 */
export function isGlobal({ scope, node }) {
  return Boolean(
    isRaw(node) ||
    isBuiltinAPI(node) ||
    isBrowserAPI(node) ||
    scope.lookup(getName(node))
  )
}

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
  if (!isGlobal({ node: path.node.object, scope: path.scope })) {
    if (isBinaryExpression(path.node.object)) {
      this.traverse(path.get('object'))
    } else if (path.value.computed) {
      this.traverse(path)
    } else {
      replacePathScope(path, isThisExpression(path.node.object) ? path.node.property : path.node)
    }
  }

  return false
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
 * Update the scope of the global nodes
 * @param   { Object } ast - ast program
 * @returns { Object } the ast program with all the global nodes updated
 */
export function updateNodesScope(ast) {
  const ignorePath = () => false

  types.visit(ast, {
    visitIdentifier: updateNodeScope,
    visitMemberExpression,
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
    transformExpression,
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
 * Create a root node proxing only its nodes and attributes
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {RiotParser.Node} root node
 */
export function createRootNode(node) {
  return {
    nodes: getChildrenNodes(node),
    isRoot: true,
    // root nodes shuold't have directives
    attributes: cleanAttributes(node)
  }
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
 * Find all the node attributes that are not expressions
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {Array} list of all the static attributes
 */
export function findStaticAttributes(node) {
  return getNodeAttributes(node).filter(attribute => !hasExpressions(attribute))
}

/**
 * Find all the node attributes that have expressions
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {Array} list of all the dynamic attributes
 */
export function findDynamicAttributes(node) {
  return getNodeAttributes(node).filter(hasExpressions)
}

/**
 * True if the node has the isCustom attribute set
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true if either it's a riot component or a custom element
 */
export function isCustomNode(node) {
  return !!(node[IS_CUSTOM_NODE] || hasIsAttribute(node))
}

/**
 * True the node is <slot>
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true if it's a slot node
 */
export function isSlotNode(node) {
  return node.name === SLOT_TAG_NODE_NAME
}

/**
 * True if the node has the isVoid attribute set
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true if the node is self closing
 */
export function isVoidNode(node) {
  return !!node[IS_VOID_NODE]
}

/**
 * True if the riot parser did find a tag node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for the tag nodes
 */
export function isTagNode(node) {
  return node.type === nodeTypes.TAG
}

/**
 * True if the riot parser did find a text node
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for the text nodes
 */
export function isTextNode(node) {
  return node.type === nodeTypes.TEXT
}

/**
 * True if the node parsed is the root one
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for the root nodes
 */
export function isRootNode(node) {
  return node.isRoot
}

/**
 * True if the attribute parsed is of type spread one
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true if the attribute node is of type spread
 */
export function isSpreadAttribute(node) {
  return node[IS_SPREAD_ATTRIBUTE]
}

/**
 * True if the node is an attribute and its name is "value"
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for value attribute nodes
 */
export function isValueAttribute(node) {
  return node.name === 'value'
}

/**
 * True if the node is an attribute and a DOM handler
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for dom listener attribute nodes
 */
export const isEventAttribute = (() => {
  const EVENT_ATTR_RE = /^on/
  return node => EVENT_ATTR_RE.test(node.name)
})()

/**
 * True if the node has expressions or expression attributes
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} ditto
 */
export function hasExpressions(node) {
  return !!(
    node.expressions ||
    // has expression attributes
    (getNodeAttributes(node).some(attribute => hasExpressions(attribute))) ||
    // has child text nodes with expressions
    (node.nodes && node.nodes.some(node => isTextNode(node) && hasExpressions(node)))
  )
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

  switch(true) {
  case isTagNode(node):
    return `<${node.name}${attributes ? ` ${attributes}` : ''}${isVoidNode(node) ? '/' : ''}>`
  case isTextNode(node):
    return hasExpressions(node) ? TEXT_NODE_EXPRESSION_PLACEHOLDER : unescapeNode(node, 'text').text
  default:
    return ''
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
 * True if the node has not expression set nor bindings directives
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only if it's a static node that doesn't need bindings or expressions
 */
export function isStaticNode(node) {
  return [
    hasExpressions,
    findEachAttribute,
    findIfAttribute,
    isCustomNode,
    isSlotNode
  ].every(test => !test(node))
}

/**
 * True if the node is a directive having its own template
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true only for the IF EACH and TAG bindings
 */
export function hasItsOwnTemplate(node) {
  return [
    findEachAttribute,
    findIfAttribute,
    isCustomNode
  ].some(test => test(node))
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
    [builders.literal('')],
  )
}

/**
 * Create a selector that will be used to find the node via dom-bindings
 * @param   {number} id - temporary variable that will be increased anytime this function will be called
 * @returns {string} selector attribute needed to bind a riot expression
 */
export const createBindingSelector = (function createSelector(id = 0) {
  return () => `${BINDING_SELECTOR_PREFIX}${id++}`
}())
