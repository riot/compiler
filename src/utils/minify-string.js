const LINE_BREAKS_RE = /(\r\n|\n|\r)/gm

/**
 * Remove the line breaks from a string trimming it as well
 * @param   { string } string - input string
 * @returns { string } minified string
 */
export default function minifyString(string) {
  return string.replace(LINE_BREAKS_RE, '').trim()
}