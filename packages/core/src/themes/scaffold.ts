/**
 * mddeck scaffold theme — minimal CSS to make impress.js steps visible.
 *
 * Injected automatically by Marpit's `themeSet.pack()` as the base style for
 * every theme. Theme authors can override individual rules in their own
 * theme CSS files.
 */

export const scaffoldCss = String.raw`
/* mddeck scaffold theme — minimal layout for impress.js steps */

:root {
  --mddeck-bg: white;
  --mddeck-fg: #1f2328;
  --mddeck-accent: #0969da;
  --mddeck-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
                 Helvetica, Arial, sans-serif, "Apple Color Emoji",
                 "Segoe UI Emoji";
  --mddeck-step-padding: 60px;
  --mddeck-step-radius: 8px;
  --mddeck-step-shadow: 0 12px 36px rgba(0,0,0,0.18);
  --mddeck-step-width: 1920px;
  --mddeck-step-height: 1080px;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--mddeck-bg);
  color: var(--mddeck-fg);
  font-family: var(--mddeck-font);
  overflow: hidden;
}

.fallback-message {
  display: none;
}
body.impress-not-supported .fallback-message {
  display: block;
  padding: 40px;
  text-align: center;
  font-size: 18px;
}
body.impress-not-supported #impress {
  display: none;
}

#impress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  transition: all 0s ease;
}

.step {
  position: absolute;
  width: var(--mddeck-step-width);
  height: var(--mddeck-step-height);
  padding: var(--mddeck-step-padding);
  box-sizing: border-box;
  background: var(--mddeck-bg);
  color: var(--mddeck-fg);
  border-radius: var(--mddeck-step-radius);
  box-shadow: var(--mddeck-step-shadow);
  transform-origin: 50% 50% 0;
  transform-style: preserve-3d;
  opacity: 0.3;
  transition: opacity 0.5s ease;
  overflow: hidden;
}

.step.active {
  opacity: 1;
}
.step.present {
  opacity: 1;
}
.step.future,
.step.past {
  opacity: 0.3;
}

.step h1, .step h2, .step h3, .step h4, .step h5, .step h6 {
  margin-top: 0;
  color: var(--mddeck-accent);
}

.step pre {
  background: #f6f8fa;
  color: #1f2328;
  padding: 16px 20px;
  border-radius: 6px;
  overflow: auto;
  font-size: 0.8em;
}

.step code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  background: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

.step blockquote {
  border-left: 4px solid var(--mddeck-accent);
  margin: 0;
  padding: 8px 20px;
  color: #57606a;
  background: rgba(9, 105, 218, 0.05);
}

.step table {
  border-collapse: collapse;
}
.step table th, .step table td {
  border: 1px solid #d0d7de;
  padding: 8px 12px;
}

.step img {
  max-width: 100%;
  max-height: 80%;
}
`

/**
 * SCSS-style meta header. Marpit reads this to extract theme metadata such
 * as width / height / auto-scaling flags.
 */
export const scaffoldMeta = String.raw`
/*!
 * @theme mddeck-scaffold
 * @auto-scaling true
 */
`
