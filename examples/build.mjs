/**
 * examples/build.mjs — Compile example markdown files into single-file HTML
 * decks using @mddeck/core + the bundled impress.js runtime.
 *
 * Usage: node examples/build.mjs [file.md ...]
 * If no files given, builds examples/basic.md → examples/basic.html
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MdDeck } from '../packages/core/dist/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const IMPRESS_JS_PATH = resolve(
  __dirname,
  '../../ref/impress.js/js/impress.js',
)

function buildOne(mdPath) {
  const markdown = readFileSync(mdPath, 'utf-8')
  const impressBundle = readFileSync(IMPRESS_JS_PATH, 'utf-8')

  const deck = new MdDeck()
  const out = deck.renderDocument({
    markdown,
    title: mdPath.replace(/^.*\//, '').replace(/\.md$/, ''),
    author: 'mddeck example',
    impressJsBundle: impressBundle,
  })

  const outPath = mdPath.replace(/\.md$/, '.html')
  writeFileSync(outPath, out)
  console.log(`✓ Built ${mdPath} → ${outPath} (${out.length.toLocaleString()} bytes)`)
}

const files = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [join(__dirname, 'basic.md')]

for (const f of files) buildOne(f)
