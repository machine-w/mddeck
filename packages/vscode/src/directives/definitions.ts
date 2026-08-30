/**
 * directives/definitions.ts — list of mddeck directives for IDE
 * completion / hover / decoration.
 *
 * Adapted from marp-vscode/src/directives/definitions.ts — replaced the
 * Bespoke.js-specific transition directive with mddeck's 3D positioning
 * directives.
 */

export interface DirectiveDefinition {
  name: string
  scope: 'global' | 'local' | 'scoped'
  description: string
}

/**
 * mddeck directives. Names match the keys accepted in front-matter or
 * HTML comments.
 */
export const mddeckDirectiveDefinitions: DirectiveDefinition[] = [
  // Global (whole deck, set in front-matter only)
  { name: 'theme', scope: 'global', description: 'Built-in theme name or path to CSS file' },
  { name: 'width', scope: 'global', description: 'Canvas width in pixels (default 1920)' },
  { name: 'height', scope: 'global', description: 'Canvas height in pixels (default 1080)' },
  { name: 'perspective', scope: 'global', description: 'CSS perspective value (default 1000, 0 = 2D)' },
  { name: 'maxScale', scope: 'global', description: 'impress.js max zoom level' },
  { name: 'minScale', scope: 'global', description: 'impress.js min zoom level' },
  { name: 'transitionDuration', scope: 'global', description: 'Default transition duration in ms' },
  { name: 'autoplay', scope: 'global', description: 'Auto-advance seconds (passed to impress.js)' },
  { name: 'math', scope: 'global', description: 'Math engine: katex / mathjax / false' },
  { name: 'headingDivider', scope: 'global', description: 'Heading level to split slides on' },
  { name: 'pdfMode', scope: 'global', description: 'PDF output mode: per-step / single' },

  // Local (applies to current and following slides; underscore prefix = scoped)
  { name: 'position', scope: 'local', description: '3D position {x, y, z} in pixels' },
  { name: 'rotate', scope: 'local', description: '3D rotation {x, y, z, order} in degrees' },
  { name: 'scale', scope: 'local', description: 'Scale factor (default 1)' },
  { name: 'stepTransitionDuration', scope: 'local', description: 'Per-step transition duration override' },
  { name: 'relPosition', scope: 'local', description: 'Use relative positioning (true/false)' },
  { name: 'relTo', scope: 'local', description: 'Reference a previous step id for relative positioning' },
]

/** Group definitions by scope for display. */
export function groupByScope(): Record<string, DirectiveDefinition[]> {
  const groups: Record<string, DirectiveDefinition[]> = {
    global: [],
    local: [],
    scoped: [],
  }
  for (const def of mddeckDirectiveDefinitions) {
    groups[def.scope].push(def)
  }
  return groups
}
