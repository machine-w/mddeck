/**
 * mddeck impress theme — modeled on the official impress.js demo deck
 * (https://impress.js.org/). White slide cards on a soft radial-gradient
 * canvas, mixed PT Sans (body) and PT Serif (slide text), restrained
 * gray palette.
 *
 * Visual reference (from impress-demo.css + impress-common.css):
 *   - body bg:    radial-gradient(rgb(240,240,240) -> rgb(190,190,190))
 *   - body font:  PT Sans, sans-serif
 *   - slide bg:   white
 *   - slide fg:   rgb(102, 102, 102)
 *   - slide font: PT Serif, Georgia, serif
 *   - slide size: 900x700 (matches the demo's .slide class)
 *   - slide chrome: 1px rgba(0,0,0,.3) border, 10px radius,
 *                   0 2px 6px rgba(0,0,0,.1) shadow
 *   - typography: 30px / 36px line-height / -1px letter-spacing
 *   - links:      white-translucent pill, soft drop-shadow
 *
 * Fonts aren't loaded automatically — users add a Google Fonts <link> at
 * the top of their markdown if they want exact typography:
 *   <link rel="stylesheet"
 *         href="https://fonts.googleapis.com/css2?family=PT+Sans&family=PT+Serif&display=swap">
 * The system fallbacks (sans-serif, Georgia, serif) ensure the deck still
 * reads correctly without the link.
 */

export const impressThemeCss = String.raw`
/*!
 * @theme impress
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
  background: white;
  border: 1px solid rgba(0, 0, 0, .3);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .1);

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

export default impressThemeCss