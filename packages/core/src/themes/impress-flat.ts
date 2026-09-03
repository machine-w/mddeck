/**
 * mddeck impress-flat theme — like 'impress' but without the card frame.
 * No border, no box-shadow, no border-radius on .step — the slide
 * content sits directly on the radial-gradient canvas as a clean,
 * borderless block of text. Same PT Sans / PT Serif typography and
 * restrained gray palette as 'impress'; just the chrome is gone.
 *
 * Visual reference (extends 'impress' theme):
 *   - body bg:    radial-gradient(rgb(240,240,240) -> rgb(190,190,190))
 *   - body font:  PT Sans, sans-serif
 *   - slide bg:   white
 *   - slide fg:   rgb(102, 102, 102)
 *   - slide font: PT Serif, Georgia, serif
 *   - typography: 30px / 36px line-height / -1px letter-spacing
 *   - NO border, NO box-shadow, NO border-radius
 *
 * Fonts aren't loaded automatically — users add a Google Fonts <link> at
 * the top of their markdown if they want exact typography:
 *   <link rel="stylesheet"
 *         href="https://fonts.googleapis.com/css2?family=PT+Sans&family=PT+Serif&display=swap">
 * The system fallbacks (sans-serif, Georgia, serif) ensure the deck still
 * reads correctly without the link.
 */

export const impressFlatThemeCss = String.raw`
/*!
 * @theme impress-flat
 * @auto-scaling true
 */

:root {
  --mddeck-bg: radial-gradient(rgb(240, 240, 240), rgb(190, 190, 190));
  --mddeck-fg: rgb(102, 102, 102);
  --mddeck-accent: rgb(102, 102, 102);
  --mddeck-font: 'PT Sans', 'Helvetica Neue', Arial, sans-serif;
  --mddeck-step-padding: 40px 60px;
}

.step {
  /* '!important' overrides Marpit's scaffold rule
     ('background: var(--mddeck-bg)') which would otherwise paint a
     second copy of the body background on top of the canvas. */
  background: white !important;
  /* NOTE: keep the scaffold's box-shadow here. impress-flat removes
     the BORDER (and border-radius) but preserves the soft drop shadow
     so the slide still has a hint of depth on the gradient. Only
     'impress-bare' (which has a transparent background) drops the
     shadow too — otherwise the card outline would be visible on the
     gradient. */

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
  background: rgb(245, 245, 245);
  color: rgb(50, 50, 50);
  padding: 16px 20px;
  border-radius: 6px;
  font-family: 'PT Mono', Menlo, Consolas, 'Courier New', monospace;
  font-size: 0.7em;
  line-height: 1.4;
  overflow: auto;
}
`

export default impressFlatThemeCss