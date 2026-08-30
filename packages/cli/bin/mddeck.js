#!/usr/bin/env node
import('../dist/mddeck-cli.js')
  .then((m) => m.cliInterface(process.argv.slice(2)))
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    console.error('✗ Fatal:', err?.message ?? err)
    process.exit(1)
  })
