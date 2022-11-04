import {builders, types} from '../../utils/build-types'
import {TAG_CSS_PROPERTY} from '../../constants'
import cssEscape from 'cssesc'
import getPreprocessorTypeByAttribute from '../../utils/get-preprocessor-type-by-attribute'
import preprocess from '../../utils/preprocess-node'

const HOST = ':host'
const DISABLED_SELECTORS = ['from', 'to']

/**
 * Matches valid, multiline JavaScript comments in almost all its forms.
 * @const {RegExp}
 * @static
 */
const R_MLCOMMS = /\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\//g

/**
 * Source for creating regexes matching valid quoted, single-line JavaScript strings.
 * It recognizes escape characters, including nested quotes and line continuation.
 * @const {string}
 */
const S_LINESTR = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source

/**
 * Matches CSS selectors, excluding those beginning with '@' and quoted strings.
 * @const {RegExp}
 */

const CSS_SELECTOR = RegExp(`([{}]|^)[; ]*((?:[^@ ;{}][^{}]*)?[^@ ;{}:] ?)(?={)|${S_LINESTR}`, 'g')

/**
 * Matches the list of css selectors excluding the pseudo selectors
 * @const {RegExp}
 */

const CSS_SELECTOR_LIST = /([^,]+)(?::\w+(?:[\s|\S]*?\))?(?:[^,:]*)?)+|([^,]+)/g

/**
 * Scope the css selectors prefixing them with the tag name
 * @param {string} tag - Tag name of the root element
 * @param {string} selectorList - list of selectors we need to scope
 * @returns {string} scoped selectors
 */
export function addScopeToSelectorList(tag, selectorList) {
  return selectorList.replace(CSS_SELECTOR_LIST, (match, selector) => {
    const trimmedMatch = match.trim()
    const trimmedSelector = selector ? selector.trim() : trimmedMatch

    // skip selectors already using the tag name
    if (trimmedSelector.indexOf(tag) === 0) {
      return match
    }

    // skips the keywords and percents of css animations
    if (!trimmedSelector || DISABLED_SELECTORS.indexOf(trimmedSelector) > -1 || trimmedSelector.slice(-1) === '%') {
      return match
    }

    // replace the `:host` pseudo-selector, where it is, with the root tag name;
    // if `:host` was not included, add the tag name as prefix, and mirror all `[is]`
    if (trimmedSelector.indexOf(HOST) < 0) {
      return `${tag} ${trimmedMatch},[is="${tag}"] ${trimmedMatch}`
    } else {
      return `${trimmedMatch.replace(HOST, tag)},${trimmedMatch.replace(HOST, `[is="${tag}"]`)}`
    }
  })
}

/**
 * Parses styles enclosed in a "scoped" tag
 * The "css" string is received without comments or surrounding spaces.
 *
 * @param   {string} tag - Tag name of the root element
 * @param   {string} css - The CSS code
 * @returns {string} CSS with the styles scoped to the root element
 */
export function generateScopedCss(tag, css) {
  return css.replace(CSS_SELECTOR, function(m, cssChunk, selectorList) {
    // skip quoted strings
    if (!selectorList) return m

    // we have a selector list, parse each individually
    const scopedSelectorList = addScopeToSelectorList(tag, selectorList)

    // add the danling bracket char and return the processed selector list
    return cssChunk ? `${cssChunk} ${scopedSelectorList}` : scopedSelectorList
  })
}

/**
 * Remove comments, compact and trim whitespace
 * @param { string } code - compiled css code
 * @returns { string } css code normalized
 */
function compactCss(code) {
  return code.replace(R_MLCOMMS, '').replace(/\s+/g, ' ').trim()
}

const escapeBackslashes = s => s.replace(/\\/g, '\\\\')
const escapeIdentifier = identifier => escapeBackslashes(cssEscape(identifier, {
  isIdentifier: true
}))

/**
 * Generate the component css
 * @param   { Object } sourceNode - node generated by the riot compiler
 * @param   { string } source - original component source code
 * @param   { Object } meta - compilation meta information
 * @param   { AST } ast - current AST output
 * @returns { AST } the AST generated
 */
export default function css(sourceNode, source, meta, ast) {
  const preprocessorName = getPreprocessorTypeByAttribute(sourceNode)
  const { options } = meta
  const preprocessorOutput = preprocess('css', preprocessorName, meta, sourceNode.text)
  const normalizedCssCode = compactCss(preprocessorOutput.code)
  const escapedCssIdentifier = escapeIdentifier(meta.tagName)

  const cssCode = (options.scopedCss ?
    generateScopedCss(escapedCssIdentifier, escapeBackslashes(normalizedCssCode)) :
    escapeBackslashes(normalizedCssCode)
  ).trim()

  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.name === TAG_CSS_PROPERTY) {
        path.value.value = builders.templateLiteral(
          [builders.templateElement({ raw: cssCode, cooked: '' }, false)],
          []
        )

        return false
      }

      this.traverse(path)
    }
  })

  return ast
}
