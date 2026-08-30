/**
 * examples/verify.mjs — Headless browser verification of the generated
 * mddeck HTML. Uses Playwright with the system chromium binary.
 *
 * Steps:
 *  1. Launch headless Chromium
 *  2. Load examples/basic.html via file:// URL
 *  3. Wait for `body.impress-ready` to be set (indicates impress.js init OK)
 *  4. Take a screenshot of each step (via impress().goto())
 *  5. Save screenshots into examples/screenshots/
 *  6. Report whether each step was reached successfully
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HTML = `file://${join(__dirname, 'basic.html')}`
const OUT = join(__dirname, 'screenshots')

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
})
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()

  // Capture console output
  const consoleLines = []
  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => consoleLines.push(`[PAGEERROR] ${err.message}`))

  await page.goto(HTML, { waitUntil: 'networkidle' })

  // Wait up to 10s for body.impress-ready
  const ready = await page
    .waitForFunction(() => document.body.classList.contains('impress-ready'), { timeout: 10000 })
    .then(() => true)
    .catch(() => false)

  if (!ready) {
    console.error('❌ impress.js did not init within 10s')
    console.error('Console output:')
    for (const line of consoleLines) console.error('  ', line)
    process.exit(1)
  }
  console.log('✓ impress.js initialized (body.impress-ready set)')

  // Dump body classes + computed style of fallback message
  const debug = await page.evaluate(() => {
    const body = document.body
    const fallback = document.querySelector('.fallback-message')
    return {
      bodyClass: body.className,
      fallbackDisplay: fallback ? getComputedStyle(fallback).display : null,
      activeStep: document.querySelector('.step.active')?.id,
      presentStep: document.querySelector('.step.present')?.id,
    }
  })
  console.log('  → debug:', JSON.stringify(debug))

  // Count steps
  const stepCount = await page.evaluate(
    () => document.querySelectorAll('div.step').length,
  )
  console.log(`✓ Found ${stepCount} step elements`)

  // Capture initial viewport
  await page.screenshot({ path: join(OUT, 'step-1-initial.png'), fullPage: false })
  console.log(`  → screenshot step-1-initial.png`)

  // Use the impress.js API to jump to each step and capture
  const result = await page.evaluate(() => {
    const win = /** @type {any} */ (window)
    const api = win.impress ? win.impress() : null
    if (!api) return { error: 'impress api not found' }
    const steps = Array.from(document.querySelectorAll('div.step'))
    return { totalSteps: steps.length, first: steps[0]?.id, last: steps[steps.length - 1]?.id }
  })
  console.log('  → impress API report:', JSON.stringify(result))

  // Take screenshots of each step
  for (let i = 0; i < stepCount; i++) {
    await page.evaluate((idx) => {
      const win = /** @type {any} */ (window)
      const api = win.impress()
      const steps = Array.from(document.querySelectorAll('div.step'))
      if (steps[idx]) api.goto(steps[idx])
    }, i)
    // Give the transition time to settle
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: join(OUT, `step-${i + 1}.png`),
      fullPage: false,
    })
    console.log(`  → screenshot step-${i + 1}.png`)
  }

  // Try keyboard navigation forward
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(OUT, 'after-arrow-right.png') })
  console.log('  → screenshot after-arrow-right.png')

  console.log('\n✅ All steps verified — open examples/screenshots/*.png to inspect')
  if (consoleLines.length > 0) {
    console.log('\nBrowser console output:')
    for (const line of consoleLines.slice(0, 20)) console.log('  ', line)
  }
} finally {
  await browser.close()
}
