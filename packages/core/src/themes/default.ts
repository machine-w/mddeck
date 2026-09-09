/**
 * mddeck default theme — GitHub-flavored look adapted for impress.js 3D.
 */

export const defaultThemeCss = String.raw`
/*!
 * @theme default
 * @auto-scaling true
 */

:root {
  --mddeck-bg: #ffffff;
  --mddeck-fg: #1f2328;
  --mddeck-accent: #0969da;
  --mddeck-step-padding: 80px;
}

.step {
  font-size: 36px;
  line-height: 1.5;
  text-align: left;
  background: var(--mddeck-bg);
}

.step h1 {
  font-size: 2.4em;
  border-bottom: 2px solid var(--mddeck-accent);
  padding-bottom: 0.2em;
}

.step h2 {
  font-size: 1.8em;
}

.step h3 {
  font-size: 1.4em;
}

.step p {
  margin: 0.6em 0;
}

.step ul, .step ol {
  padding-left: 1.5em;
}

.step li {
  margin: 0.3em 0;
}

.step a {
  color: var(--mddeck-accent);
  text-decoration: none;
}
.step a:hover {
  text-decoration: underline;
}

/* Font-size utility classes. Add <!-- _class: tiny --> (or small /
   normal / big / huge) on a slide to scale the whole step's text
   proportionally. The em-based headings in the theme (h1, h2, h3)
   inherit the step's font-size and scale together. */
.step.tiny   { font-size: 14px; }
.step.small  { font-size: 20px; }
.step.normal { font-size: 28px; }
.step.big    { font-size: 42px; }
.step.huge   { font-size: 60px; }
`

export default defaultThemeCss
