# BracketCSS :sparkles:
 
BracketCSS is not like LESS or SASS with functions, it is design for web responsive with variables and media queries

## Installation 🌍
    $ npm install bracketcss
    
## How it works ?

Initialize

```javascript
const bracketcss = require("bracketcss");

const result = bracketcss(`bracketcss code...`)
```

## Define variable

Like SCSS you can use the $ expression

```scss
$color: blue;
```

## Use Variable

```scss
    color: ${color};
```

## Define multiple media queries

This (BracketCSS) :

```scss
@media screen and max-width: [1920px, 1024px, 778px] {
    p {
        color: [red, green, blue];
        content: "\n";
    }
}
```

Become (CSS) :
```css
@media screen and (max-width: 1920px){p{color: red;content: "\n";}}@media screen and (max-width: 1024px){p{color: green;content: "\n";}}@media screen and (max-width: 778px){p{color: blue;content: "\n";}}
```