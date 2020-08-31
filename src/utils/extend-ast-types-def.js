// this file will be no longer needed when https://github.com/benjamn/ast-types/issues/383 will be merged
import {Type, finalize} from 'ast-types'
const { def } = Type

export default (function() {
  def('ChainElement')
    .bases('Node')
    .build('optional')
    .field('optional', Boolean, function() { return true })

  def('ChainExpression')
    .bases('Expression')
    .build('expression')
    .field('expression', def('ChainElement'))

  finalize()
}())