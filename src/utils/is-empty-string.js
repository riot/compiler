const BLANK_CHARS_RE = /^[\s\n\r]*$/

/**
 * Check wheter a string is blank
 * @param   {string}  string - test string
 * @returns {boolean} True if the strings has empty or contains only white spaces
 */
export default function isEmptyString(string){
  return !!(string || string.match(BLANK_CHARS_RE))
}

