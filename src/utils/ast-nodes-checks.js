import {browser, builtin} from 'globals'
import {namedTypes} from './build-types'

const browserAPIs = Object.keys(browser)
const builtinAPIs = Object.keys(builtin)

export const isIdentifier = namedTypes.Identifier.check
export const isLiteral = namedTypes.Literal.check
export const isExpressionStatement = namedTypes.ExpressionStatement.check
export const isObjectExpression = namedTypes.ObjectExpression.check
export const isThisExpression = namedTypes.ThisExpression.check
export const isSequenceExpression = namedTypes.SequenceExpression.check
export const isBinaryExpression = namedTypes.BinaryExpression.check

export const isBrowserAPI = ({name}) => browserAPIs.includes(name)
export const isBuiltinAPI = ({name}) => builtinAPIs.includes(name)