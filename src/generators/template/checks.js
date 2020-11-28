import {
  IS_CUSTOM_NODE,
  IS_SPREAD_ATTRIBUTE,
  IS_VOID_NODE,
  PROGRESS_TAG_NODE_NAME, SLOT_ATTRIBUTE,
  SLOT_TAG_NODE_NAME,
  TEMPLATE_TAG_NODE_NAME
} from './constants'
import {findAttribute, findEachAttribute, findIfAttribute, findIsAttribute, findKeyAttribute} from './find'
import {
  getName,
  getNodeAttributes
} from './utils'
import {isBrowserAPI, isBuiltinAPI, isNewExpression, isRaw} from '../../utils/ast-nodes-checks'
import compose from 'cumpa'
import {isNil} from '@riotjs/util/checks'
import {nodeTypes} from '@riotjs/parser'
import {types} from '../../utils/build-types'

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
 * Check if a node should be rendered in the final component HTML
 * For example slot <template slot="content"> tags not using `each` or `if` directives can be removed
 * see also https://github.com/riot/riot/issues/2888
 * @param   {RiotParser.Node} node - riot parser node
 * @returns {boolean} true if we can remove this tag from the component rendered HTML
 */
export function isRemovableNode(node) {
  return isTemplateNode(node) && !isNil(findAttribute(SLOT_ATTRIBUTE, node)) && !hasEachAttribute(node) && !hasIfAttribute(node)
}

/**
 * Check if a node name is part of the browser or builtin javascript api or it belongs to the current scope
 * @param   { types.NodePath } path - containing the current node visited
 * @returns {boolean} true if it's a global api variable
 */
export function isGlobal({ scope, node }) {
  // recursively find the identifier of this AST path
  if (node.object) {
    return isGlobal({ node: node.object, scope })
  }

  return Boolean(
    isRaw(node) ||
    isBuiltinAPI(node) ||
    isBrowserAPI(node) ||
    isNewExpression(node) ||
    isNodeInScope(scope, node)
  )
}

/**
 * Checks if the identifier of a given node exists in a scope
 * @param {Scope} scope - scope where to search for the identifier
 * @param {types.Node} node - node to search for the identifier
 * @returns {boolean} true if the node identifier is defined in the given scope
 */
function isNodeInScope(scope, node) {
  const traverse = (isInScope = false) => {
    types.visit(node, {
      visitIdentifier(path) {
        if (scope.lookup(getName(path.node))) {
          isInScope = true
        }

        this.abort()
      }
    })

    return isInScope
  }

  return traverse()
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
 * True if the DOM node is a progress tag
 * @param   {RiotParser.Node}  node - riot parser node
 * @returns {boolean} true for the progress tags
 */
export function isProgressNode(node) {
  return node.name === PROGRESS_TAG_NODE_NAME
}

/**
 * True if the DOM node is a <template> tag
 * @param   {RiotParser.Node}  node - riot parser node
 * @returns {boolean} true for the progress tags
 */
export function isTemplateNode(node) {
  return node.name === TEMPLATE_TAG_NODE_NAME
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
 * Check if a string is an html comment
 * @param   {string}  string - test string
 * @returns {boolean} true if html comment
 */
export function isCommentString(string) {
  return string.trim().indexOf('<!') === 0
}

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

export const hasIfAttribute = compose(Boolean, findIfAttribute)
export const hasEachAttribute = compose(Boolean, findEachAttribute)
export const hasIsAttribute = compose(Boolean, findIsAttribute)
export const hasKeyAttribute = compose(Boolean, findKeyAttribute)
