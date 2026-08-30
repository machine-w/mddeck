/**
 * mddeck CLI main entry — yargs command definition.
 *
 * Usage:
 *   mddeck <input.md> [-o output.html] [--pdf]
 *   mddeck -w <input.md>          (watch + rebuild)
 *   mddeck -s [--port 8080]       (serve a directory)
 */

import { resolve } from 'node:path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { Converter } from './converter.js'
import { File, loadFiles } from './file.js'
import { loadConfig, mergeConfig } from './config.js'

const VERSION = '0.1.0'

export async function cliInterface(argv: string[]): Promise<number> {
  // Load config (optional — don't block startup if it fails)
  let fileConfig: any = {}
  try {
    fileConfig = await loadConfig()
  } catch (err: any) {
    console.warn(`⚠ Could not load config: ${err.message}`)
  }

  const parser = yargs(argv)
    .scriptName('mddeck')
    .parserConfiguration({
      "short-option-groups": false,
      "parse-numbers": false,
    })
    .usage(`Usage: $0 [options] <files...>`)
    .version(VERSION)
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Output file path',
    })
    .option('pdf', {
      type: 'boolean',
      describe: 'Generate PDF instead of HTML (uses puppeteer-core)',
    })
    .option('theme', {
      type: 'string',
      describe: 'Theme name (default / gaia / uncover) or CSS file path',
    })
    .option('watch', {
      alias: 'w',
      type: 'boolean',
      describe: 'Watch input files and rebuild on change',
    })
    .option('server', {
      alias: 's',
      type: 'boolean',
      describe: 'Serve the output directory over HTTP',
    })
    .option('port', {
      type: 'number',
      default: 8080,
      describe: 'Port for server mode',
    })
    .option('browser', {
      type: 'string',
      describe: 'Path to Chromium executable for PDF',
    })
    .option('pdf-size', {
      type: 'string',
      default: '1920x1080',
      describe: 'PDF page size (e.g. 1920x1080, 1280x720)',
    })
    .option('math', {
      type: 'string',
      choices: ['katex', 'mathjax', 'false'] as const,
      describe: 'Math engine (katex by default; requires katex installed)',
    })
    .option('stdin', {
      type: 'boolean',
      describe: 'Read markdown from stdin',
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      describe: 'Path to mddeck config file',
    })

  const args = await parser.parseAsync()

  // Merge config (CLI overrides file)
  const cfg = mergeConfig(fileConfig, {
    output: args.output as string | undefined,
    theme: args.theme as string | undefined,
    mddeck: {
      ...fileConfig.mddeck,
      ...(args.math ? { math: args.math === 'false' ? false : (args.math as any) } : {}),
    },
  } as any)

  if (args.config) {
    // Re-load config from the specified path (advanced)
    // (skipped for simplicity — file config already loaded)
  }

  // Dispatch
  if (args.watch) return runWatch(args, cfg)
  if (args.server) return runServer(args, cfg)
  if (args.stdin) return runStdin(args, cfg)
  if (args._.length === 0) {
    parser.showHelp()
    return 1
  }
  return runFiles(args._ as string[], cfg)
}

async function runFiles(paths: string[], cfg: any): Promise<number> {
  try {
    const files = await loadFiles(paths.map((p) => resolve(p)))
    const converter = new Converter({
      output: cfg.output,
      type: cfg.pdf ? 'pdf' : undefined,
      browserPath: cfg.browser,
      pdfSize: cfg['pdf-size'],
      theme: cfg.theme,
      ...(cfg.mddeck ?? {}),
    } as any)

    for (const file of files) {
      const out = await converter.convertFile(file)
      console.log(`✓ ${file.path} → ${out}`)
    }
    return 0
  } catch (err: any) {
    console.error('✗ Error:', err.message, err.stack)
    return 1
  }
}

async function runStdin(args: any, cfg: any): Promise<number> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  const content = Buffer.concat(chunks).toString('utf-8')
  const file = new File('')
  file.setContent(content)
  const converter = new Converter({
    output: cfg.output,
    type: cfg.pdf ? 'pdf' : undefined,
    browserPath: cfg.browser,
    pdfSize: cfg['pdf-size'],
    theme: cfg.theme,
    ...(cfg.mddeck ?? {}),
  } as any)
  try {
    const out = await converter.convertFile(file)
    console.log(`✓ (stdin) → ${out}`)
    return 0
  } catch (err: any) {
    console.error('✗ Error:', err.message)
    return 1
  }
}

async function runWatch(args: any, cfg: any): Promise<number> {
  const chokidar = await import('chokidar')
  const paths = (args._ as string[]).map((p) => resolve(p))
  if (paths.length === 0) {
    console.error('✗ --watch requires at least one input file')
    return 1
  }
  console.log(`👀 Watching ${paths.join(', ')}`)
  const watcher = chokidar.watch(paths, { ignoreInitial: false })
  const converter = new Converter({
    output: cfg.output,
    type: cfg.pdf ? 'pdf' : undefined,
    browserPath: cfg.browser,
    pdfSize: cfg['pdf-size'],
    theme: cfg.theme,
    ...(cfg.mddeck ?? {}),
  } as any)

  watcher.on('change', async (p) => {
    console.log(`\n↻ Changed: ${p}`)
    const file = new File(p)
    try {
      await file.load()
      const out = await converter.convertFile(file)
      console.log(`✓ ${p} → ${out}`)
    } catch (err: any) {
      console.error(`✗ ${err.message}`)
    }
  })
  watcher.on('add', async (p) => {
    console.log(`\n+ Added: ${p}`)
    const file = new File(p)
    try {
      await file.load()
      const out = await converter.convertFile(file)
      console.log(`✓ ${p} → ${out}`)
    } catch (err: any) {
      console.error(`✗ ${err.message}`)
    }
  })

  // Keep process alive
  await new Promise(() => {})
  return 0
}

async function runServer(args: any, cfg: any): Promise<number> {
  const express = (await import('express')).default
  const serveIndex = (await import('serve-index')).default
  const { dirname } = await import('node:path')

  // Output dir is the parent of `output` or current dir
  const outputDir = cfg.output
    ? dirname(resolve(cfg.output))
    : process.cwd()

  // Build current files at startup
  const paths = (args._ as string[]).map((p) => resolve(p))
  const converter = new Converter({
    output: cfg.output,
    theme: cfg.theme,
    ...(cfg.mddeck ?? {}),
  } as any)
  for (const p of paths) {
    const file = new File(p)
    try {
      await file.load()
      await converter.convertFile(file)
    } catch (err: any) {
      console.error(`✗ ${err.message}`)
    }
  }

  const app = express()
  app.use(serveIndex(outputDir, { icons: true }))
  app.use(express.static(outputDir))
  const port = (args.port as number) ?? 8080
  app.listen(port, () => {
    console.log(`🚀 mddeck server: http://localhost:${port}/`)
    console.log(`   Serving: ${outputDir}`)
  })

  // Keep alive
  await new Promise(() => {})
  return 0
}
