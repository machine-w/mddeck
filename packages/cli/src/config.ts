/**
 * Config loader — uses cosmiconfig to read `mddeck.config.js` etc.
 */

import { cosmiconfig } from 'cosmiconfig'
import type { MdDeckOptions } from '@machine-w/mddeck-core'

export interface MdDeckConfig {
  /** Default options applied to every deck */
  mddeck?: MdDeckOptions
  /** Output directory for HTML/PDF */
  output?: string
  /** Whether to watch files and rebuild */
  watch?: boolean
  /** Whether to serve over HTTP */
  server?: boolean | number
  /** Allow loading local files from HTML (for image/font URLs) */
  allowLocalFiles?: boolean
  /** Theme: 'default' | 'gaia' | 'uncover' | path */
  theme?: string
}

const explorer = cosmiconfig('mddeck', {
  searchPlaces: [
    'mddeck.config.js',
    'mddeck.config.cjs',
    'mddeck.config.mjs',
    'mddeck.config.ts',
    '.mddeckrc',
    '.mddeckrc.json',
    'package.json',
  ],
  loaders: {
    '.ts': async (filepath) => {
      // Lazy import to avoid loading ts-node unless needed
      const { readFile } = await import('node:fs/promises')
      const ts = await import('typescript')
      const src = await readFile(filepath, 'utf-8')
      const compiled = ts.default.transpileModule(src, {
        compilerOptions: { module: ts.default.ModuleKind.CommonJS, target: ts.default.ScriptTarget.ES2020 },
      }).outputText
      const m = new (require('node:module').Module)(filepath)
      m._compile(compiled, filepath)
      return m.exports
    },
  },
})

export async function loadConfig(): Promise<MdDeckConfig> {
  const result = await explorer.search(process.cwd())
  return (result?.config ?? {}) as MdDeckConfig
}

export function mergeConfig(
  fileConfig: MdDeckConfig,
  cliOptions: Partial<MdDeckConfig>,
): MdDeckConfig {
  return { ...fileConfig, ...cliOptions }
}
