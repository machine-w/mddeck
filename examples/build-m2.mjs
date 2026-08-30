/**
 * examples/build-m2.mjs — Build the M2 features demo HTML and run a
 * headless browser verification to capture screenshots.
 */

import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MdDeck } from '../packages/core/dist/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MD_PATH = join(__dirname, 'm2-features.md')
const HTML_PATH = MD_PATH.replace(/\.md$/, '.html')
const OUT_DIR = join(__dirname, 'screenshots-m2')
const IMPRESS_JS_PATH = resolve(__dirname, '../../ref/impress.js/js/impress.js')

mkdirSync(OUT_DIR, { recursive: true })

// 1. Build the HTML using @mddeck/core + inlined impress.js bundle
const markdown = readFileSync(MD_PATH, 'utf-8')
const impressBundle = readFileSync(IMPRESS_JS_PATH, 'utf-8')
const deck = new MdDeck({ math: 'katex' })
const html = await deck.renderDocument({
  markdown,
  title: 'mddeck M2 Features',
  author: 'mddeck',
  impressJsBundle: impressBundle,
})
writeFileSync(HTML_PATH, html)
console.log(`✓ Built ${MD_PATH} → ${HTML_PATH} (${html.length.toLocaleString()} bytes)`)

// 2. Verify in a headless browser
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
})
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  const consoleLines = []
  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLines.push(`[PAGEERROR] ${err.message}`))

  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'networkidle' })
  const ready = await page
    .waitForFunction(() => document.body.classList.contains('impress-ready'), { timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (!ready) {
    console.error('❌ impress.js init failed')
    for (const l of consoleLines) console.error('  ', l)
    process.exit(1)
  }
  console.log('✓ impress.js initialized')

  // Inspect each step's contents
  const stepCount = await page.evaluate(() => document.querySelectorAll('div.step').length)
  console.log(`✓ Found ${stepCount} steps`)

  for (let i = 0; i < stepCount; i++) {
    await page.evaluate((idx) => {
      const win = /** @type {any} */ (window)
      const api = win.impress()
      const steps = Array.from(document.querySelectorAll('div.step'))
      if (steps[idx]) api.goto(steps[idx])
    }, i)
    await page.waitForTimeout(1800) // let mathjax render + transition settle
    await page.screenshot({ path: join(OUT_DIR, `step-${i + 1}.png`) })
    console.log(`  → screenshot step-${i + 1}.png`)
  }

  // Inspect each step for math / emoji / XSS markers
  const audit = await page.evaluate(() => {
    const steps = Array.from(document.querySelectorAll('div.step'))
    return steps.map((s, i) => ({
      id: s.id,
      hasMathSvg: !!s.querySelector('svg[data-mjx-container], svg[jax="SVG"], .mjx-container, math'),
      hasTwemoji: !!s.querySelector('img[data-marp-twemoji]'),
      hasStrong: !!s.querySelector('strong'),
      htmlLength: s.innerHTML.length,
      preview: s.innerHTML.slice(0, 100),
    }))
  })
  console.log('\n=== Step audit ===')
  for (const a of audit) {
    console.log(`${a.id}: math=${a.hasMathSvg} twemoji=${a.hasTwemoji} strong=${a.hasStrong} len=${a.htmlLength}`)
  }
  console.log('\n✅ M2 verification complete — screenshots in ' + OUT_DIR)
} finally {
  await browser.close()
}
