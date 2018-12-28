import {
  closeTag,
  createBindingSelector,
  findDynamicAttributes,
  findEachAttribute,
  findIfAttribute,
  getChildrenNodes,
  getNodeAttributes,
  isCustomNode,
  isStaticNode,
  isTagNode,
  isTextNode,
  nodeToString
} from './utils'
import cloneDeep from '../../utils/clone-deep'
import eachBinding from './bindings/each'
import ifBinding from './bindings/if'
import simpleBinding from './bindings/simple'
import tagBinding from './bindings/tag'

const BuildingState = Object.freeze({
  html: [],
  bindings: [],
  parent: null
})

/**
 * Nodes having bindings should be cloned and new selector properties should be added to them
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {string} bindingsSelector - temporary string to identify the current node
 * @returns {RiotParser.Node} the original node parsed having the additional `bindingsSelector` property
 */
function createBindingsTag(sourceNode, bindingsSelector) {
  return {
    ...sourceNode,
    bindingsSelector,
    // inject the selector bindings into the node attributes
    attributes: [{
      name: bindingsSelector
    }, ...getNodeAttributes(sourceNode)]
  }
}

/**
 * Create a generic dynamic node (text or tag) and generate its bindings
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {BuildingState} state - state representing the current building tree state during the recursion
 * @returns {Array} array containing the html output and bindings for the current node
 */
function createDynamicNode(sourceNode, sourceFile, sourceCode, state) {
  switch (true) {
  case isTagNode(sourceNode):
    return createTagWithBindings(sourceNode, sourceFile, sourceCode, state)
  case isTextNode(sourceNode):
    return [nodeToString(sourceNode), simpleBinding(sourceNode, sourceFile, sourceCode, state)]
  default:
    return ['', []]
  }
}

/**
 * Create only a dynamic tag node with generating a custom selector and its bindings
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {BuildingState} state - state representing the current building tree state during the recursion
 * @returns {Array} array containing the html output and bindings for the current node
 */
function createTagWithBindings(sourceNode, sourceFile, sourceCode, state) {
  const bindingsSelector = createBindingSelector()
  const cloneNode = createBindingsTag(sourceNode, bindingsSelector)
  const tagOpeningHTML = nodeToString(cloneNode)

  switch(true) {
  // EACH bindings have prio 1
  case findEachAttribute(cloneNode):
    return [tagOpeningHTML, eachBinding(sourceNode, bindingsSelector, sourceFile, sourceCode)]
  // IF bindings have prio 2
  case findIfAttribute(cloneNode):
    return [tagOpeningHTML, ifBinding(sourceNode, bindingsSelector, sourceFile, sourceCode)]
  // TAG bindings have prio 3
  case isCustomNode(cloneNode):
    return [tagOpeningHTML, tagBinding(sourceNode, bindingsSelector, sourceFile, sourceCode)]
  // attribute bindings come as last
  default:
    return [tagOpeningHTML, ...createAttributeExpressions(sourceNode, sourceFile, sourceCode, state)]
  }
}

/**
 * Create the attribute bindings
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {BuildingState} state - state representing the current building tree state during the recursion
 * @returns {Array} array containing all the attribute bindings
 */
function createAttributeExpressions(sourceNode, sourceFile, sourceCode, state) {
  return findDynamicAttributes(sourceNode)
    .map(attribute => simpleBinding(attribute, sourceFile, sourceCode, state))
}

/**
 * Parse a node trying to extract its template and bindings
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {BuildingState} state - state representing the current building tree state during the recursion
 * @returns {Array} array containing the html output and bindings for the current node
 */
function parseNode(sourceNode, sourceFile, sourceCode, state) {
  // static nodes have no bindings
  if (isStaticNode(sourceNode)) return [nodeToString(sourceNode), []]
  return createDynamicNode(sourceNode, sourceFile, sourceCode, state)
}

/**
 * Build the template and the bindings
 * @param   {RiotParser.Node} sourceNode - any kind of node parsed via riot parser
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @param   {BuildingState} state - state representing the current building tree state during the recursion
 * @returns {Array} array containing the html output and the dom bindings
 */
export default function build(
  sourceNode,
  sourceFile,
  sourceCode,
  state
) {
  const [nodeHTML, nodeBindings] = parseNode(sourceNode, sourceFile, sourceCode, state)
  const childrenNodes = getChildrenNodes(sourceNode)
  const currentState = { ...cloneDeep(BuildingState), ...state }

  // mutate the original arrays
  currentState.html.push(...nodeHTML)
  currentState.bindings.push(...nodeBindings)

  // do recursion
  // this tag has children
  if (childrenNodes.length) {
    childrenNodes.forEach(node => build(node, sourceFile, sourceCode, { parent: sourceNode }))

    // close the tags having children
    if (isTagNode(sourceNode)) {
      currentState.html.push(closeTag(sourceNode))
    }
  }

  return [
    currentState.html.join(''),
    currentState.bindings
  ]
}