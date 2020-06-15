import globalScope from 'globals'
import {namedTypes} from './build-types'

const browserAPIs = Object.keys(globalScope.browser)
const builtinAPIs = Object.keys(globalScope.builtin)

export const isIdentifier = n => namedTypes.Identifier.check(n)
export const isLiteral = n => namedTypes.Literal.check(n)
export const isExpressionStatement = n => namedTypes.ExpressionStatement.check(n)
export const isObjectExpression = n => namedTypes.ObjectExpression.check(n)
export const isThisExpression = n => namedTypes.ThisExpression.check(n)
export const isNewExpression = n => namedTypes.NewExpression.check(n)
export const isSequenceExpression = n => namedTypes.SequenceExpression.check(n)
export const isBinaryExpression = n => namedTypes.BinaryExpression.check(n)
export const isUnaryExpression = n => namedTypes.UnaryExpression.check(n)
export const isExportDefaultStatement = n => namedTypes.ExportDefaultDeclaration.check(n)
export const isMemberExpression = n => namedTypes.MemberExpression.check(n)
export const isArrayExpression = n => namedTypes.ArrayExpression.check(n)

export const isBrowserAPI = ({name}) => browserAPIs.includes(name)
export const isBuiltinAPI = ({name}) => builtinAPIs.includes(name)
export const isRaw = n => n && n.raw