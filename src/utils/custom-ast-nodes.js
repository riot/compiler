import {builders} from './build-types'

export function nullNode() {
  return builders.literal(null)
}

export function simplePropertyNode(key, value) {
  return builders.property('init', builders.literal(key), value, false)
}