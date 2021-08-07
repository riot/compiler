import globalScope from 'globals'
import {namedTypes} from './build-types'

const browserAPIs = ['window', 'document', 'console']
const builtinAPIs = Object.keys(globalScope.builtin)

export const isIdentifier = n => namedTypes.Identifier.check(n)
export const isLiteral = n => namedTypes.Literal.check(n)
export const isExpressionStatement = n => namedTypes.ExpressionStatement.check(n)
export const isThisExpression = n => namedTypes.ThisExpression.check(n)
export const isThisExpressionStatement = n =>
  isExpressionStatement(n) &&
  isMemberExpression(n.expression.left) &&
  isThisExpression(n.expression.left.object)
export const isNewExpression = n => namedTypes.NewExpression.check(n)
export const isSequenceExpression = n => namedTypes.SequenceExpression.check(n)
export const isExportDefaultStatement = n => namedTypes.ExportDefaultDeclaration.check(n)
export const isMemberExpression = n => namedTypes.MemberExpression.check(n)
export const isImportDeclaration = n => namedTypes.ImportDeclaration.check(n)
export const isTypeAliasDeclaration = n => namedTypes.TSTypeAliasDeclaration.check(n)
export const isInterfaceDeclaration = n => namedTypes.TSInterfaceDeclaration.check(n)
export const isExportNamedDeclaration = n => namedTypes.ExportNamedDeclaration.check(n)

export const isBrowserAPI = ({name}) => browserAPIs.includes(name)
export const isBuiltinAPI = ({name}) => builtinAPIs.includes(name)
export const isRaw = n => n && n.raw
