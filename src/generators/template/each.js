import {BINDING_TYPES, EACH_BINDING_TYPE} from './constants'
import {expressionToScopedFunction, findAttribute} from './template-utils'
import {builders} from '../../utils/build-types'

export function createEachBinding(node, sourceFile, sourceCode) {
  const ifAttribute = findAttribute(node, 'if')

  return builders.objectExpression([
    builders.property('type',
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(EACH_BINDING_TYPE),
        false
      )
    ),
    builders.property('condition',
      ifAttribute ? expressionToScopedFunction(ifAttribute, sourceFile, sourceCode) : builders.literal(),
    ),
    builders.property('itemName',
      builders.memberExpression()
    )
  ])
}