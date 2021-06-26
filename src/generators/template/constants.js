import {constants} from '@riotjs/parser'

export const BINDING_TYPES = 'bindingTypes'
export const EACH_BINDING_TYPE = 'EACH'
export const IF_BINDING_TYPE = 'IF'
export const TAG_BINDING_TYPE = 'TAG'
export const SLOT_BINDING_TYPE = 'SLOT'


export const EXPRESSION_TYPES = 'expressionTypes'
export const ATTRIBUTE_EXPRESSION_TYPE = 'ATTRIBUTE'
export const VALUE_EXPRESSION_TYPE = 'VALUE'
export const TEXT_EXPRESSION_TYPE = 'TEXT'
export const EVENT_EXPRESSION_TYPE = 'EVENT'

export const TEMPLATE_FN = 'template'
export const SCOPE = '_scope'
export const GET_COMPONENT_FN = 'getComponent'

// keys needed to create the DOM bindings
export const BINDING_SELECTOR_KEY = 'selector'
export const BINDING_GET_COMPONENT_KEY = 'getComponent'
export const BINDING_TEMPLATE_KEY = 'template'
export const BINDING_TYPE_KEY = 'type'
export const BINDING_REDUNDANT_ATTRIBUTE_KEY = 'redundantAttribute'
export const BINDING_CONDITION_KEY = 'condition'
export const BINDING_ITEM_NAME_KEY = 'itemName'
export const BINDING_GET_KEY_KEY = 'getKey'
export const BINDING_INDEX_NAME_KEY = 'indexName'
export const BINDING_EVALUATE_KEY = 'evaluate'
export const BINDING_NAME_KEY = 'name'
export const BINDING_SLOTS_KEY = 'slots'
export const BINDING_EXPRESSIONS_KEY = 'expressions'
export const BINDING_CHILD_NODE_INDEX_KEY = 'childNodeIndex'
// slots keys
export const BINDING_BINDINGS_KEY = 'bindings'
export const BINDING_ID_KEY = 'id'
export const BINDING_HTML_KEY = 'html'
export const BINDING_ATTRIBUTES_KEY = 'attributes'

// DOM directives
export const IF_DIRECTIVE = 'if'
export const EACH_DIRECTIVE = 'each'
export const KEY_ATTRIBUTE = 'key'
export const SLOT_ATTRIBUTE = 'slot'
export const NAME_ATTRIBUTE = 'name'
export const IS_DIRECTIVE = 'is'

// Misc
export const DEFAULT_SLOT_NAME = 'default'
export const TEXT_NODE_EXPRESSION_PLACEHOLDER = ' '
export const BINDING_SELECTOR_PREFIX = 'expr'
export const SLOT_TAG_NODE_NAME = 'slot'
export const PROGRESS_TAG_NODE_NAME = 'progress'
export const TEMPLATE_TAG_NODE_NAME = 'template'

// Riot Parser constants
export const IS_RAW_NODE = constants.IS_RAW
export const IS_VOID_NODE = constants.IS_VOID
export const IS_CUSTOM_NODE = constants.IS_CUSTOM
export const IS_BOOLEAN_ATTRIBUTE = constants.IS_BOOLEAN
export const IS_SPREAD_ATTRIBUTE = constants.IS_SPREAD


