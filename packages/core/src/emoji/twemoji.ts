/**
 * twemoji CSS for inline emoji rendering. Originally vendored as
 * twemoji.scss in marp-core; converted to a TS string so we don't need a
 * SCSS loader.
 */
export default String.raw`
img[data-marp-twemoji] {
  background: transparent;
  height: 1em;
  margin: 0 0.05em 0 0.1em;
  vertical-align: -0.1em;
  width: 1em;
}
`
