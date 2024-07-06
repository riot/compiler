import { builders, types } from '../../utils/build-types.js'
import { TAG_CSS_PROPERTY } from '../../constants.js'
import cssEscape from 'cssesc'
import CSSParser from 'css-simple-parser'
import getPreprocessorTypeByAttribute from '../../utils/get-preprocessor-type-by-attribute.js'
import preprocess from '../../utils/preprocess-node.js'
import { watch } from 'rollup'

const HOST = ':host'
const DISABLED_SELECTORS = ['from', 'to']

/**
 * Matches valid, multiline JavaScript comments in almost all its forms.
 * @const {RegExp}
 * @static
 */
const R_MLCOMMS = /\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\//g

/**
 * Matches the list of css selectors excluding the pseudo selectors
 * @const {RegExp}
 */

const CSS_SELECTOR_LIST =
  /([^,]+)(?::(?!host)\w+(?:[\s|\S]*?\))?(?:[^,:]*)?)+|([^,]+)/g

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
    if (
      !trimmedSelector ||
      DISABLED_SELECTORS.indexOf(trimmedSelector) > -1 ||
      trimmedSelector.slice(-1) === '%'
    ) {
      return match
    }

    // replace the `:host` pseudo-selector, where it is, with the root tag name;
    // if `:host` was not included, add the tag name as prefix, and mirror all `[is]`
    if (trimmedMatch.indexOf(HOST) < 0) {
      return `${tag} ${trimmedMatch},[is="${tag}"] ${trimmedMatch}`
    } else {
      return `${trimmedMatch.replace(HOST, tag)},${trimmedMatch.replace(
        HOST,
        `[is="${tag}"]`,
      )}`
    }
  })
}

/**
 * Traverse the ast children
 * @param {CSSParser.AST | CSSParser.NODE} ast - css parser node or ast
 * @param {Function} fn - function that is needed to parse the single nodes
 * @returns {CSSParser.AST | CSSParser.NODE} the original ast received
 */
const traverse = (ast, fn) => {
  const { children } = ast

  children.forEach((child) => {
    // if fn returns false we stop the recurstion
    if (fn(child) !== false) traverse(child, fn)
  })

  return ast
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
  const ast = CSSParser.parse(css)

  traverse(ast, (node) => {
    if (!node.selector.trim().startsWith('@')) {
      // the css parser doesn't detect the comments so we manually remove them
      const selector = node.selector.replace(R_MLCOMMS, '')

      // replace the selector and override the original css
      css = css.replace(node.selector, addScopeToSelectorList(tag, selector))
      // stop the recurstion
      return false
    }
  })

  return css
}

/**
 * Remove comments, compact and trim whitespace
 * @param { string } code - compiled css code
 * @returns { string } css code normalized
 */
function compactCss(code) {
  return code.replace(R_MLCOMMS, '').replace(/\s+/g, ' ').trim()
}

const escapeBackslashes = (s) => s.replace(/\\/g, '\\\\')
const escapeIdentifier = (identifier) =>
  escapeBackslashes(
    cssEscape(identifier, {
      isIdentifier: true,
    }),
  )

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
  const preprocessorOutput = preprocess(
    'css',
    preprocessorName,
    meta,
    sourceNode.text,
  )
  const normalizedCssCode = compactCss(preprocessorOutput.code)
  const escapedCssIdentifier = escapeIdentifier(meta.tagName)

  const cssCode = (
    options.scopedCss
      ? generateScopedCss(
          escapedCssIdentifier,
          escapeBackslashes(normalizedCssCode),
        )
      : escapeBackslashes(normalizedCssCode)
  ).trim()

  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.name === TAG_CSS_PROPERTY) {
        path.value.value = builders.templateLiteral(
          [builders.templateElement({ raw: cssCode, cooked: '' }, false)],
          [],
        )

        return false
      }

      this.traverse(path)
    },
  })

  return ast
}
