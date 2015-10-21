# Backslashes and Whitespace

From the perspective of the riot compiler and `tmpl`, backslashes within the template are characters without special meaning, except when prefixed to riot brackets. `tmpl` removes the escape character from the riot brackets when compiling the template, the other backslashes are preserved. EOLs are converted to spaces and compacted. This happens in the quoted HTML text and element values, inclusive.

In strings and regexes inside expressions, whitespace are preserved.
