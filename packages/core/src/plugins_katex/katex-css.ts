/**
 * KaTeX CSS overrides — originally vendored as `katex.scss` in marp-core.
 * The SCSS uses `@use 'sass:meta'` and `@include meta.load-css('pkg:katex/...')`
 * which require a SCSS compiler. We replace it with a plain CSS string that
 * users can either inline or serve from CDN.
 *
 * The bundled katex.min.css from the npm `katex` package is the canonical
 * stylesheet; this file just adds the small overrides needed by mddeck.
 */

export default String.raw`
/* KaTeX display block — match marp-core overrides */
.katex-display {
  margin: 0;
}

/*
 * Chrome browser may not render a symbol with .op-symbol class due to
 * relative positioning for the inline element.
 * https://github.com/marp-team/marp-vscode/issues/393
 */
.katex .delimcenter,
.katex .op-symbol {
  display: inline-block;
}
`
