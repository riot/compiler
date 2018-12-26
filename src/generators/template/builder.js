/* eslint-disable */
import {nullNode} from '../../utils/custom-ast-nodes'
import {
  isStaticNode,
  findIfAttribute,
  findEachAttribute,
  hasExpressions,
  createBindingSelector,
  startNodeToString
} from './utils'
import {nodeTypes} from '@riotjs/parser'
import eachBinding from './bindings/each'
import ifBinding from './bindings/if'

function createNodeWithBindings(sourceNode, sourceFile, sourceCode) {
  const bindingsSelector = createBindingSelector()
  // inject the bindings selector into the node attributes
  const cloneNode = {
    ...sourceNode,
    attributes: [{
      name: bindingsSelector
    }, ...(sourceNode.attributes || [])]
  }
}

function parseNode(sourceNode, sourceFile, sourceCode) {
  const isStatic = isStaticNode(sourceNode)

  if (isStatic) {
    return [startNodeToString(sourceNode), []]
  }

  return createNodeWithBindings(sourceNode, sourceFile, sourceCode);
}


export default function build(sourceNode, sourceFile, sourceCode) {
  //const [html, bindings] = parseNode(sourceNode, sourceFile, sourceCode)

  return [nullNode()]
}