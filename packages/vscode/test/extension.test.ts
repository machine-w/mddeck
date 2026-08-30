/**
 * Unit tests for mddeck-vscode — focus on pure functions that don't
 * require a running VS Code instance.
 */

import { describe, it, expect } from 'vitest'

// Note: we can't easily test the extension's `activate` function outside
// of VS Code. The main testable logic lives in `directives/definitions.ts`
// (pure data) and the helper exports from `option.ts`.

import { mddeckDirectiveDefinitions, groupByScope } from '../src/directives/definitions.js'

describe('directives/definitions', () => {
  it('exposes the expected global directives', () => {
    const names = mddeckDirectiveDefinitions
      .filter((d) => d.scope === 'global')
      .map((d) => d.name)
    expect(names).toContain('theme')
    expect(names).toContain('width')
    expect(names).toContain('perspective')
    expect(names).toContain('math')
  })

  it('exposes the expected local directives', () => {
    const names = mddeckDirectiveDefinitions
      .filter((d) => d.scope === 'local')
      .map((d) => d.name)
    expect(names).toContain('position')
    expect(names).toContain('rotate')
    expect(names).toContain('scale')
    expect(names).toContain('stepTransitionDuration')
  })

  it('does NOT include marp-vsix-specific directives like `transition`', () => {
    const names = mddeckDirectiveDefinitions.map((d) => d.name)
    expect(names).not.toContain('transition')
    expect(names).not.toContain('spot')
    expect(names).not.toContain('paginate')
    expect(names).not.toContain('backgroundColor')
  })

  it('groupByScope returns buckets keyed by scope', () => {
    const groups = groupByScope()
    expect(groups.global.length).toBeGreaterThan(0)
    expect(groups.local.length).toBeGreaterThan(0)
    expect(Array.isArray(groups.scoped)).toBe(true)
  })
})

describe('extension metadata', () => {
  it('package.json declares the expected contributes commands', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkgPath = path.join(here, '..', 'package.json')
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))

    // Check commands
    const commands: string[] = (pkg.contributes.commands ?? []).map(
      (c: { command: string }) => c.command,
    )
    expect(commands).toContain('markdown.mddeck.export')
    expect(commands).toContain('markdown.mddeck.newMddeckMarkdown')
    expect(commands).toContain('markdown.mddeck.toggleMddeckFeature')

    // Check that markdown.markdownItPlugins is true (the preview hook)
    expect(pkg.contributes['markdown.markdownItPlugins']).toBe(true)

    // Check settings are under markdown.mddeck.* (not markdown.marp.*)
    const configProps = Object.keys(
      pkg.contributes.configuration.properties ?? {},
    )
    for (const p of configProps) {
      expect(p).toMatch(/^markdown\.mddeck\./)
    }
  })

  it('activationEvents is `onLanguage:markdown`', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkg = JSON.parse(
      await fs.readFile(path.join(here, '..', 'package.json'), 'utf-8'),
    )
    expect(pkg.activationEvents).toContain('onLanguage:markdown')
  })
})
