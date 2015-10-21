# Backslashes and Whitespace

From the perspective of the riot compiler and `tmpl`, backslashes in the template are characters without special meaning, the compiler preserves this in the HTML, and remove inside the expressions.

EOLs are converted to spaces and compacted. This happens in the quoted HTML text and the element values.

In strings and regexes inside expressions, whitespace are preserved.
