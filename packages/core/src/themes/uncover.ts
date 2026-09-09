/**
 * mddeck uncover theme — academic / conference style with bottom-corner pagination.
 */

export const uncoverThemeCss = String.raw`
/*!
 * @theme uncover
 * @auto-scaling true
 */

:root {
  --mddeck-bg: #fafafa;
  --mddeck-fg: #2d3748;
  --mddeck-accent: #b83280;
  --mddeck-step-padding: 30px 70px;
}

.step {
  background: var(--mddeck-bg);
  color: var(--mddeck-fg);
  font-size: 40px;
  line-height: 1.4;
}

.step h1 {
  text-align: center;
  font-size: 2.5em;
  color: var(--mddeck-accent);
}

.step h2 {
  text-align: center;
  font-size: 2em;
}

.step p {
  text-align: justify;
}

/* Bottom-right pagination triangle, a la uncover */
.step::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 60px 60px;
  border-color: transparent transparent var(--mddeck-accent) transparent;
  opacity: 0.7;
}

/* Font-size utility classes. */
.step.tiny   { font-size: 14px; }
.step.small  { font-size: 20px; }
.step.normal { font-size: 28px; }
.step.big    { font-size: 42px; }
.step.huge   { font-size: 60px; }
`

export default uncoverThemeCss
