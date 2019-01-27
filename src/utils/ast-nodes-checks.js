import globalScope from 'globals'
import {namedTypes} from './build-types'

const browserAPIs = Object.keys(globalScope.browser)
const builtinAPIs = Object.keys(globalScope.builtin)

export const isIdentifier = namedTypes.Identifier.check.bind(namedTypes.Identifier)
export const isLiteral = namedTypes.Literal.check.bind(namedTypes.Literal)
export const isExpressionStatement = namedTypes.ExpressionStatement.check.bind(namedTypes.ExpressionStatement)
export const isObjectExpression = namedTypes.ObjectExpression.check.bind(namedTypes.ObjectExpression)
export const isThisExpression = namedTypes.ThisExpression.check.bind(namedTypes.ThisExpression)
export const isSequenceExpression = namedTypes.SequenceExpression.check.bind(namedTypes.SequenceExpression)
export const isBinaryExpression = namedTypes.BinaryExpression.check.bind(namedTypes.BinaryExpression)
export const isExportDefaultStatement = namedTypes.ExportDefaultDeclaration.check.bind(namedTypes.ExportDefaultDeclaration)

export const isBrowserAPI = ({name}) => browserAPIs.includes(name)
export const isBuiltinAPI = ({name}) => builtinAPIs.includes(name)
export const isRaw = (node) => node && node.raw