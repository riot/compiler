import {EACH_DIRECTIVE, IF_DIRECTIVE, IS_DIRECTIVE, KEY_ATTRIBUTE} from './constants'
import {getName, getNodeAttributes} from './utils'
import {hasExpressions} from './checks'

/**
 * Find the attribute node
 * @param   { string } name -  name of the attribute we want to find
 * @param   { riotParser.nodeTypes.TAG } node - a tag node
 * @returns { riotParser.nodeTypes.ATTR } attribute node
 */
export function findAttribute(name, node) {
  return node.attributes && node.attributes.find(attr => getName(attr) === name)
}

export function findIfAttribute(node) {
  return findAttribute(IF_DIRECTIVE, node)
}

export function findEachAttribute(node) {
  return findAttribute(EACH_DIRECTIVE, node)
}

export function findKeyAttribute(node) {
  return findAttribute(KEY_ATTRIBUTE, node)
}

export function findIsAttribute(node) {
  return findAttribute(IS_DIRECTIVE, node)
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
