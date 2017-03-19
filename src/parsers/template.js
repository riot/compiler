import { each, conditional } from './flow-expressions'
/**
 * HTML_TAGS matches opening and self-closing tags, not the content.
 * Used by {@link module:compiler~_compileHTML|_compileHTML} after hidding
 * the expressions.
 *
 * 2016-01-18: exclude `'\s'` from attr capture to avoid unnecessary call to
 *  {@link module:compiler~parseAttribs|parseAttribs}
 * @const {RegExp}
 */
export const HTML_TAGS = /<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)(\/?)>/g
/**
 * HTML5 void elements that cannot be auto-closed.
 * @const {RegExp}
 * @see   {@link http://www.w3.org/TR/html-markup/syntax.html#syntax-elements}
 * @see   {@link http://www.w3.org/TR/html5/syntax.html#void-elements}
 */
export const VOID_TAGS = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/
// match all the "{" and "\{" and "${" to replace eventually with "${"
export const TMPL_EXPR = /(({|[\\|$]{))(?!#)/
// match all the {#whathever } expressions
export const START_FLOW_EXPR = /{#(\w+(?:\sif)?)(?:\s)?(.+)?}/
// match all the {/whathever } expressions
export const END_FLOW_EXPR = /{\/(?:\s+)?(\w+)(?:\s+)?}/


export function replaceFlow(expr, name, value, position) {
  switch (name) {
  case 'each':
    return each[position](expr, value)
  case 'if':
    return conditional[position](expr, value)
  default:
    return expr
  }
}

export function normalizeMarkup(name, attr, ends) {
  // force all tag names to lowercase
  name = name.toLowerCase()
  // close self-closing tag, except if this is a html5 void tag
  ends = ends && !VOID_TAGS.test(name) ? `></${name}` : ''
  return `<${name}${ends}>`
}


export function parse(html, offset) {
  const lines = html.split('\n')
  const map = []

  lines.map((line, row) => {
    map.push({
      original: { line: row + offset, column: 0 },
      generated: { line: row + 1, column: 0 }
    })

    line
      .replace(TMPL_EXPR, expr => expr.substring(0, 1) === '{' ? '${' : expr)
      .replace(START_FLOW_EXPR, (_, expr, name, value) => {
        lines[row -1] = lines[row -1].trim()
        lines[row -1] += '${'
        return replaceFlow(expr, name, value, 'start')
      })
      .replace(END_FLOW_EXPR, (_, expr, name, value) => {
        lines[row +1] = lines[row -1].trim()
        lines[row +1] = '}' + lines[row +1]
        return replaceFlow(expr, name, value, 'end')
      })
      .replace(HTML_TAGS, (_, name, attr, ends) => normalizeMarkup(name, attr, ends))
  })

}