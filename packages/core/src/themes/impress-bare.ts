/**
 * mddeck impress-bare theme — like 'impress' but the slide is fully
 * transparent. No white card, no border, no box-shadow, no border-radius
 * — the text floats directly on the page's radial-gradient canvas.
 *
 * Visual reference (extends 'impress-flat' theme):
 *   - body bg:    radial-gradient(rgb(240,240,240) -> rgb(190,190,190))
 *   - body font:  PT Sans, sans-serif
 *   - slide bg:   transparent (the canvas shows through)
 *   - slide fg:   rgb(102, 102, 102)
 *   - slide font: PT Serif, Georgia, serif
 *   - typography: 30px / 36px line-height / -1px letter-spacing
 *   - NO card, NO border, NO box-shadow, NO border-radius
 *
 * Useful for the "type-as-art" feel where the text is the only thing
 * on screen. Code blocks and link pills still have their own subtle
 * backgrounds so they remain readable when sitting on the gradient.
 *
 * Fonts aren't loaded automatically — users add a Google Fonts <link> at
 * the top of their markdown if they want exact typography:
 *   <link rel="stylesheet"
 *         href="https://fonts.googleapis.com/css2?family=PT+Sans&family=PT+Serif&display=swap">
 */

export const impressBareThemeCss = String.raw`
/*!
 * @theme impress-bare
 * @auto-scaling true
 */

:root {
  /* Much-subtler radial gradient than 'impress' (which goes from
     rgb(240,240,240) to rgb(190,190,190) — a 50/255 contrast that's
     very visible). With a transparent slide, that bright-center /
     dark-edges contrast would read as a 'card' around the text, so
     here the endpoints are only 7/255 apart and the gradient is
     barely perceptible. The text appears to float on a near-uniform
     canvas, matching the user's reference. */
  --mddeck-bg: radial-gradient(rgb(245, 245, 245), rgb(238, 238, 238));
  --mddeck-fg: rgb(102, 102, 102);
  --mddeck-accent: rgb(102, 102, 102);
  --mddeck-font: 'PT Sans', 'Helvetica Neue', Arial, sans-serif;
  --mddeck-step-padding: 40px 60px;
}

.step {
  /* '!important' to override the more-specific
     'div.marpit.mddeck > div.mddeck-slide-container > .step' rule that
     Marpit's scaffold injects, which would otherwise set
     'background: var(--mddeck-bg)' and paint a second copy of the
     radial gradient on top of the canvas. Without this, the slide
     shows up as a faint card on the gradient. */
  background: transparent !important;
  /* Also override the scaffold's box-shadow variable
     ('--mddeck-step-shadow: 0 12px 36px rgba(0,0,0,0.18)'), otherwise
     a soft gray glow renders around the slide bounds and looks like
     a 'card outline' on the gradient. */
  box-shadow: none !important;

  color: var(--mddeck-fg);
  font-family: 'PT Serif', Georgia, 'Times New Roman', serif;
  font-size: 30px;
  line-height: 36px;
  letter-spacing: -1px;
  text-shadow: 0 2px 2px rgba(0, 0, 0, .1);
}

.step h1 {
  font-size: 60px;
  line-height: 1.2;
  margin-bottom: 0.4em;
}

.step h2 {
  font-size: 42px;
  line-height: 1.2;
  margin-bottom: 0.3em;
}

.step p {
  margin-bottom: 0.6em;
}

.step a {
  color: inherit;
  text-decoration: none;
  padding: 0 0.1em;
  background: rgba(255, 255, 255, 0.6);
  text-shadow: -1px -1px 2px rgba(100, 100, 100, 0.9);
  border-radius: 0.2em;
  transition: background 0.5s, text-shadow 0.5s;
}
.step a:hover,
.step a:focus {
  background: rgba(255, 255, 255, 1);
  text-shadow: -1px -1px 2px rgba(100, 100, 100, 0.5);
}

.step code {
  font-family: 'PT Mono', Menlo, Consolas, 'Courier New', monospace;
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.05em 0.3em;
  border-radius: 3px;
}

.step pre {
  background: rgba(245, 245, 245, 0.85);
  color: rgb(50, 50, 50);
  padding: 16px 20px;
  border-radius: 6px;
  font-family: 'PT Mono', Menlo, Consolas, 'Courier New', monospace;
  font-size: 0.7em;
  line-height: 1.4;
  overflow: auto;
}
`

export default impressBareThemeCss