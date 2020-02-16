// this file will be no longer needed when https://github.com/benjamn/ast-types/pull/365 will be merged
import {Type, finalize} from 'ast-types'

const { def } = Type

export default (function() {
  def('ImportExpression')
    .bases('Expression')
    .build('source')
    .field('source', def('Expression'))

  finalize()
}())