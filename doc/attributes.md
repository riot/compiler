Boolean attributes in riot 2.3
==============================

From _HTML5 - A vocabulary and associated APIs for HTML and XHTML_ - W3C Recommendation, 28 October 2014:

> 2.4.2 Boolean attributes
>
> A number of attributes are boolean attributes. The presence of a boolean attribute on an element represents the true value, and the absence of the attribute represents the false value.
>
> If the attribute is present, its value must either be the empty string or a value that is an ASCII case-insensitive match for the attribute's canonical name, with no leading or trailing whitespace.
>
> **Note:** The values "true" and "false" are not allowed on boolean attributes. To represent a false value, the attribute has to be omitted altogether.
>

When the expression is trueish, riot sets the boolean attribute value to the attribute's name:
```html
<my-tag disabled={ 'yes' }></my-tag>
```

riot replaces `disabled` with `__disabled` to avoid issues, then at runtime will generate
```html
<my-tag disabled="disabled"></my-tag>
```

Boolean attributes are ignored (i.e. not rendered) when the expression value is falsy.


## Recognized attributes

There's no official list with all the boolean attributes, but we collect that information from different sources.
Currently riot v2.3.x recognizes these:

* allowfullscreen - `<iframe>` - WHATWG HTML Living Standard, not in W3C HTML5
* checked   - `<input>` - for type "radio" or "checkbox"
* compact   - `<ol>`/`<ul>`/`<dir>` - deprecated in html5
* disabled  - used in almost all form elements
* ismap     - for `<img>` elements descendant of an `<a>` element with href
* noresize  - `<frame>` - deprecated in html5
* noshade   - `<hr>` - deprecated in html5
* nowrap    - `<td>` - deprecated in html5
* readonly  - `<input>`/`<textarea>`
* reversed  - `<ol>`
* seamless  - `<iframe>` - WHATWG HTML Living Standard, not in W3C HTML5
* selected  - `<option>`
* truespeed - `<marquee>` - not supported by Chrome/Opera

...and these html5 attributes:
* autofocus
* autoplay  - `<audio>`/`<video>`
* controls  - `<audio>`/`<video>`
* default   - `<track>`/`<menuitem>` (menuitem is not yet supported by browsers)
* formnovalidate
* hidden
* itemscope - for html5 Microdata
* loop      - `<audio>`/`<video>`
* multiple
* muted     - `<audio>`/`<video>`
* novalidate
* open      - `<details>`/`<dialog>`
* required
* sortable  - html 5.1
* typemustmatch - `<object>`

**Warning:** Please don't use expressions in the `loop` attribute for `<img>` tags.
In images, `loop` is not a boolean attribute. ~~This will fix soon.~~

Tested with [the w3c Validator](https://validator.w3.org/nu)


## Removed attributes

The following unused or non-boolean attributes, recognized in previous versions, are removed in v2.3.0:

* async - `<script>` - riot does not support async scripts in custom tags
* declare - `<object>` - unuseful in main browsers
* defaultChecked - it is a property, not an attribute
* defer - `<script>` - riot does not handle this, only IE8/9 honors this attribute
* draggable - not boolean, this is an enumerated attribute: true, false, auto
* inert - this proposed html5 attribute was [dropped](https://html5.org/r/8536) from the spec
* enabled - not in the HTML spec
* indeterminate - this attribute can't be set with markup
* nohref - `<area>` - deprecated, same effect as _not_ including a `href` attribute
* pauseonexit - `<track>` - not for markup, it is too complex
* spellcheck - not boolean, this is an enumerated attribute: true, false
* translate - not boolean, this is an enumerated attribute: yes, no
* visible - not in the HTML spec


## Special Attributes

The following attributes give error when parsed on browsers with `{ exrp_value }`.  
`d` describes the SVG `<path>`, Chrome gives error if the value has an invalid format.

See: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d

- `style`
- `src`
- `d`


## References:

http://www.w3.org/TR/html5/infrastructure.html#boolean-attributes  
http://w3c.github.io/html-reference/global-attributes.html  
http://javascript.info/tutorial/attributes-and-custom-properties  
http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html  
http://www.w3.org/wiki/HTML/Elements/audio  
http://www.quackit.com/html_5/tags/html_iframe_tag.cfm
