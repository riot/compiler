# Backslashes and Whitespace

From the perspective of the riot compiler and `tmpl`, backslashes in the template are characters with no special meaning. The compiler preserves them in the HTML and expressions, with one exception: backslashes used to escape riot brackets are temporarily removed when the expression is passed to a parser, and finally removed at runtime, before evaluating the expression.

In the html, including quoted text, newlines are converted to spaces and compacted, except if you pass the `whitespace` option to the compiler. With this options, newlines are normalized to `\n` and preserved.

In quoted strings and regexes inside expressions, all whitespace are preserved.
