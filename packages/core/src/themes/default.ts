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
`

export default defaultThemeCss
