/**
 * Converter — orchestrates Markdown → HTML/PDF conversion.
 *
 * - HTML output: synchronous render via @machine-w/mddeck-core + impress template
 * - PDF output:  uses puppeteer-core to load the rendered HTML in headless
 *                Chromium, waits for `body.impress-ready`, then calls
 *                page.pdf() with print-mode CSS injected
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { MdDeck } from '@machine-w/mddeck-core'
import type { MdDeckOptions } from '@machine-w/mddeck-core'

import { File } from './file.js'
import { renderImpressTemplate } from './templates/impress/layout.js'

export type ConvertType = 'html' | 'pdf'

export interface ConverterOptions extends MdDeckOptions {
  /** Output file path */
  output?: string
  /** Force a specific output type */
  type?: ConvertType
  /** Path to a Chromium executable (for PDF) */
  browserPath?: string
  /** Page size for PDF (e.g. '16:9' or '1920x1080') */
  pdfSize?: string
}

/** Auto-detect a Chromium binary on the system. */
function findChromium(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  // Common paths
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ]
  for (const c of candidates) {
    try {
      if (existsSync(c)) return c
    } catch {}
  }
  return undefined
}

/** Print-mode CSS injected before page.pdf() so 3D is flattened.
 *
 * impress.js init applies transforms AND container sizing at four levels:
 *   1. `html, body` — `height: 100%` to make a fullscreen 3D canvas. The
 *      body element stays 1080px tall in headless Chrome, so even with
 *      `page-break-after: always` on each .step, page.pdf() only sees one
 *      page worth of body content. Must be reset to `height: auto` so
 *      the body grows to fit all stacked steps.
 *   2. `#impress` — `transform: scale(0.416667)` for auto-fit-to-viewport
 *   3. `#impress > div` (anonymous centering wrapper) —
 *      `transform: translate(STEP_X, STEP_Y)` to position the active step
 *      in the viewport center. Both translate values are huge numbers
 *      because they compensate for the step's `data-x/y`.
 *   4. `.step` itself — `transform: translate3d(STEP_X, STEP_Y, STEP_Z)`
 *      for the slide's individual 3D position.
 *
 * If any of these four levels is left intact, the steps end up
 * physically positioned outside the PDF page dimensions (1920×1080) and
 * every page comes out blank. The earlier version only reset level 4
 * and the bug was "steps are off-screen because the centering
 * translate on level 3 is still applied". After fixing that, a second
 * bug surfaced: even with page-breaks on .step, the html/body sizing
 * capped the document at one viewport height, so page.pdf() only
 * generated one page.
 *
 * 5. `.step` opacity — impress.js applies `opacity: 0.3` to all steps
 *    by default and `opacity: 1` only to the currently-active one
 *    (the rest are tagged `.step.future` / `.step.past` and faded).
 *    In PDF every slide needs full opacity, so PRINT_MODE_CSS forces
 *    `opacity: 1 !important` to win over `.step.future/.past`'s
 *    `opacity: 0.3` (which would otherwise make pages 2..N appear
 *    grayed-out). */
const PRINT_MODE_CSS = `
/* mddeck: print mode — flatten impress.js 3D for PDF */
html, body {
  height: auto !important;
  min-height: auto !important;
  overflow: visible !important;
}
#impress,
#impress > div {
  position: static !important;
  transform: none !important;
  width: auto !important;
  height: auto !important;
  top: auto !important;
  left: auto !important;
  perspective: none !important;
  transform-style: flat !important;
}
.step {
  /* Fill the page. Marpit's scaffold hardcodes '.step { width: 1280px;
     height: 720px }' (rewritten from its 'section' rule); the page-size
     CSS vars override it here so each PDF page is fully covered. */
  width: var(--pdf-w, 1920px) !important;
  height: var(--pdf-h, 1080px) !important;
  /* Scale up the root font-size by --pdf-scale so all 'em'-based sizes
     (h1, h2, p, code, etc.) grow proportionally to fill the larger
     page. Pixel-sized values (paddings, margins, box-shadow blur) stay
     the same. The step layout box still respects page-break-after
     so we get exactly one slide per page with no overflow. */
  font-size: calc(36px * var(--pdf-scale, 1)) !important;
  /* Vertically center the content within the now-larger box. */
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  position: relative !important;
  transform: none !important;
  transform-origin: 50% 50% !important;
  page-break-after: always;
  break-after: page;
  margin: 0 !important;
  top: auto !important;
  left: auto !important;
  /* Drop the box-shadow so it doesn't bleed past the layout box. */
  box-shadow: none !important;
  /* Force full opacity on every step. impress.js dims non-active
     steps to 0.3 via '.step.future { opacity: 0.3 }', which would
     otherwise render pages 2..N of the PDF as faded / grayed-out. */
  opacity: 1 !important;
}
.step:last-child { page-break-after: auto; break-after: auto; }
body.impress-not-supported .fallback-message { display: none !important; }
body.impress-not-supported #impress { display: block !important; }
`

export class Converter {
  constructor(public readonly options: ConverterOptions = {}) {}

  /** Convert a single file to HTML or PDF based on options. */
  async convertFile(file: File): Promise<string> {
    const markdown = file.content
    if (markdown == null) throw new Error(`File ${file.path} has no content`)

    const type = this.options.type ?? this.inferType(file, this.options.output)

    if (type === 'pdf') return this.convertToPdf(file, markdown)
    return this.convertToHtml(file, markdown)
  }

  /** Render markdown → complete single-file HTML document and write to disk. */
  async convertToHtml(file: File, markdown: string): Promise<string> {
    const out = file.outputPath(this.options.output, '.html')
    const deck = new MdDeck(this.options)
    const html = await renderImpressTemplate(deck, markdown, {
      title: file.path ? file.path.replace(/^.*\//, '').replace(/\.md$/, '') : undefined,
    })
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, html, 'utf-8')
    return out
  }

  /** Render markdown → PDF via puppeteer-core + headless Chromium. */
  async convertToPdf(file: File, markdown: string): Promise<string> {
    const out = file.outputPath(this.options.output, '.pdf')
    await mkdir(dirname(out), { recursive: true })

    // Lazy import puppeteer-core (it might not be installed in every env)
    let puppeteer: typeof import('puppeteer-core')
    try {
      puppeteer = (await import('puppeteer-core')).default as any
    } catch (err) {
      throw new Error(
        'puppeteer-core is required for PDF output. Install it: `npm i -D puppeteer-core`.',
      )
    }

    const deck = new MdDeck({ ...this.options, printable: true })
    const { width, height } = this.resolvePdfSize(deck)

    // Inject the resolved page size + a scale factor so PRINT_MODE_CSS can
    // expand the step to fill the page. The base 1280 matches Marpit's
    // hardcoded scaffold size in @marp-team/marpit/lib/theme/scaffold.js
    // (which `step_replace` rewrites to `.step`). When the step uses
    // --mddeck-step-width/height from a custom theme, the user can override
    // these CSS variables in that theme; we don't try to detect that here.
    const PRINT_VARS = `:root { --pdf-w: ${width}px; --pdf-h: ${height}px; --pdf-scale: ${(width / 1280).toFixed(4)}; }`
    const html = await renderImpressTemplate(deck, markdown, {
      extraCss: `${PRINT_VARS}\n${PRINT_MODE_CSS}`,
      title: file.path ? file.path.replace(/^.*\//, '').replace(/\.md$/, '') : undefined,
    })

    const executablePath = this.options.browserPath ?? findChromium()
    if (!executablePath) {
      throw new Error(
        'Could not find a Chromium executable. ' +
          'Set CHROME_PATH / PUPPETEER_EXECUTABLE_PATH, or pass --browser <path>.',
      )
    }
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      // Wait for impress.js init to complete (body.impress-ready class).
      await page
        .waitForFunction(
          'document.body && document.body.classList.contains("impress-ready")',
          { timeout: 15000 },
        )
        .catch(() => {
          // impress.js init may fail silently if browser doesn't support it
        })

      // Parse pdfSize: 'WIDTHxHEIGHT' (px) or '16:9' (aspect, fallback to sizeInfo)
      const { width, height } = this.resolvePdfSize(deck)

      await page.pdf({
        path: out,
        printBackground: true,
        preferCSSPageSize: false,
        width: `${width}px`,
        height: `${height}px`,
      })
    } finally {
      await browser.close()
    }
    return out
  }

  /** Infer output type from extension (.pdf vs default). */
  private inferType(file: File, output?: string): ConvertType {
    const target = output ?? file.outputPath(undefined, '.html')
    return target.endsWith('.pdf') ? 'pdf' : 'html'
  }

  /** Resolve PDF page dimensions in px. */
  private resolvePdfSize(deck: MdDeck): { width: number; height: number } {
    const size = this.options.pdfSize
    if (size && size !== '16:9' && size !== '4:3') {
      const m = size.match(/^(\d+)x(\d+)$/)
      if (m) return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) }
    }
    return { width: deck.sizeInfo.width, height: deck.sizeInfo.height }
  }
}
