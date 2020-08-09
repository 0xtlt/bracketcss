# BracketCSS :sparkles:

BracketCSS is designed for web responsive with variables, media queries and now functions !

## Installation 🌍

    $ npm install bracketcss

## How it works ?

Initialize

```javascript
const bracketcss = require("bracketcss");

const result = bracketcss(`bracketcss code...`);
```

## Define variable

Like SCSS you can use the \$ expression

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

    strong {
      font-weight: bold;
    }
  }
}
```

Become (CSS) :

```css
@media screen and (max-width: 1920px) {
  p {
    color: red;
    content: "\n";
  }
  p strong {
    font-weight: bold;
  }
}
@media screen and (max-width: 1024px) {
  p {
    color: green;
    content: "\n";
  }
  p strong {
    font-weight: bold;
  }
}
@media screen and (max-width: 778px) {
  p {
    color: blue;
    content: "\n";
  }
  p strong {
    font-weight: bold;
  }
}
```

## Define function

Functions are written in javascript but defined with the `fnc` keyword

```javascript
fnc componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

fnc rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
```

## Use function

You can use the variable system in functions

```scss
$size: 12px;
$red: 255;

p {
    font-size: ${size};
    color: rgbToHex(${red}, 10, 35);
}

@media screen and max-width: [1024px, 778px] {
    p {
        font-size: [14px, 15px];
        color: [red(), blue()];

        strong {
            color: [rgbToHex(${red}, 10, 35), rgbToHex(${red}, 250, 35)];
        }
    }
}
```

## Pre-Built functions

Lighten
hex, percent (0 - 100)

```scss
color: lighten(#21eae3, 20);
```

Darken
hex, percent (0 - 100)

```scss
color: darken(#21eae3, 20);
```

Opacify
hex, percent (0 - 1)

```scss
color: opacify(#21eae3, 0.2);
```

Hex To RGB
hex

```scss
color: hexToRGB(#21eae3);
```
