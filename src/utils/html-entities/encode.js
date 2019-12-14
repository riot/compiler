import entities from './entities.json'

const HTMLEntityRe = /&(\S+);/g
const HEX_NUMBER = /^[\da-fA-F]+$/
const DECIMAL_NUMBER = /^\d+$/

/**
 * Encode unicode hex html entities like for example &#x222;
 * @param   {string} string - input string
 * @returns {string} encoded string
 */
export function encodeHex(string) {
  const hex = string.substr(2)

  return HEX_NUMBER.test(hex) ?
    String.fromCodePoint(parseInt(hex, 16)) :
    string
}

/**
 * Encode unicode decimal html entities like for example &#222;
 * @param   {string} string - input string
 * @returns {string} encoded string
 */
export function encodeDecimal(string) {
  const nr = string.substr(1)

  return DECIMAL_NUMBER.test(nr) ?
    String.fromCodePoint(parseInt(nr, 10))
    : string
}

/**
 * Encode html entities in strings like &nbsp;
 * @param   {string} string - input string
 * @returns {string} encoded string
 */
export default function encodeHTMLEntities(string) {
  return string.replace(HTMLEntityRe, (match, entity) => {
    const [firstChar, secondChar] = entity

    if (firstChar === '#') {
      return secondChar === 'x' ?
        encodeHex(entity) :
        encodeDecimal(entity)
    } else {
      return entities[entity] || entity
    }
  })
}