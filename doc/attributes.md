Attributes
==========

The following attributes give error when parsed on browser with `{ exrp_value }`.
`d` describes the SVG `<path>`, Chrome gives error if the value has invalid format.  
See: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d

- `style`
- `src`
- `d`

Boolean Attributes
------------------

References:

http://www.w3.org/TR/html5/infrastructure.html#boolean-attributes  
http://w3c.github.io/html-reference/global-attributes.html  
http://javascript.info/tutorial/attributes-and-custom-properties  
http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html  
http://www.w3.org/wiki/HTML/Elements/audio  

Tested with [the w3c Validator](https://validator.w3.org/nu)

### All time boolean

- disabled
- checked
- readonly
- ismap
- reversed - `<ol>`
- selected

### New html5 attributes

- autofocus
- formnovalidate
- hidden
- inert
- itemscope - html5 Microdata
- multiple
- novalidate
- required
- typemustmatch
- default - `<menuitem>` (not yet supported by browsers)
- open - `<details>`/`<dialog>`
- sortable - html 5.1

### Not supported in html5

- allowfullscreen - `<iframe>`
- seamless - `<iframe>`
- noresize - `<frame>`
- noshade - `<hr>` (obsolete)
- nohref - `<area>`
- nowrap - `<td>`
- compact - `<ol>`/`<ul>`/`<dir>`
- truespeed - `<marquee>` attribute not supported by Chrome/Opera

### For the `<video>` element

- autoplay
- controls
- loop
- default - `<track>`
- muted

## Removed from BOOL_ATTR

- async -- `<script>` riot does not handle this
- defer -- `<script>` riot does not handle this, only IE8+ honors this attribute
- defaultChecked, Muted, Selected -- they are properties, not attributes
- draggable -- not boolean, this is an enumerated attribute: true, false, auto
- spellcheck -- not boolean, this is an enumerated attribute: true, false
- translate -- not boolean, this is an enumerated attribute: yes, no
- declare - `<object>` unuseful in main browsers
- indeterminate - boolean attr, but can't be set with markup
- pauseonexit - `<track>` not for markup, or it is too complex
- enabled - not in the HTML specs
- visible - not in the HTML specs
