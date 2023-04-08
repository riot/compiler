import { builders } from './build-types.js'

export function nullNode() {
  return builders.literal(null)
}

export function simplePropertyNode(key, value) {
  const property = builders.property(
    'init',
    builders.identifier(key),
    value,
    false,
  )

  property.sho
  return property
}
