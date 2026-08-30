/**
 * mddeck gaia theme — bold blue background with centered content.
 */

export const gaiaThemeCss = String.raw`
/*!
 * @theme gaia
 * @auto-scaling true
 */

:root {
  --mddeck-bg: #1c3a5e;
  --mddeck-fg: #f5f7fa;
  --mddeck-accent: #f0b429;
  --mddeck-step-padding: 70px;
}

.step {
  background: linear-gradient(135deg, #1c3a5e 0%, #2c5282 100%);
  color: var(--mddeck-fg);
  font-size: 38px;
  line-height: 1.4;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.step h1 {
  color: var(--mddeck-accent);
  font-size: 3em;
  font-weight: 700;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.step h2 {
  color: var(--mddeck-fg);
  font-size: 2.2em;
}

.step a {
  color: var(--mddeck-accent);
}

.step code {
  background: rgba(255,255,255,0.1);
  color: #ffd66e;
}
`

export default gaiaThemeCss
