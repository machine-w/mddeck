/**
 * Converter — orchestrates Markdown → HTML/PDF conversion.
 *
 * - HTML output: synchronous render via @mddeck/core + impress template
 * - PDF output:  uses puppeteer-core to load the rendered HTML in headless
 *                Chromium, waits for `body.impress-ready`, then calls
 *                page.pdf() with print-mode CSS injected
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { MdDeck } from '@mddeck/core'
import type { MdDeckOptions } from '@mddeck/core'

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

/** Print-mode CSS injected before page.pdf() so 3D is flattened. */
const PRINT_MODE_CSS = `
/* mddeck: print mode — flatten impress.js 3D for PDF */
#impress {
  perspective: none !important;
  transform-style: flat !important;
}
.step {
  position: relative !important;
  transform: none !important;
  transform-origin: 50% 50% !important;
  page-break-after: always;
  break-after: page;
  margin: 0 !important;
  top: auto !important;
  left: auto !important;
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
    const html = await renderImpressTemplate(deck, markdown, {
      extraCss: PRINT_MODE_CSS,
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
