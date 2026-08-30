/**
 * mddeck directives — registers all custom directives consumed by
 * mddeck_impress.ts.
 *
 * Two kinds:
 *  1. Globals  — applied to the whole deck (frontmatter or first HTML comment).
 *                Most become `data-*` attributes on the <div id="impress"> root.
 *  2. Locals   — applied per-slide (any HTML comment inside the slide).
 *                Most become `data-*` attributes on the <div class="step">.
 *
 * Marpit's directive engine automatically supports:
 *  - YAML front-matter at the top of the file
 *  - HTML comments like <!-- _foo: bar -->
 *  - Scoped locals (keys prefixed with `_`) that apply only to the current slide
 *
 * See: ref/marpit/src/markdown/directives/{parse,apply}.js
 */

import yaml from 'js-yaml'
import type { Marpit } from '@marp-team/marpit'
import type { DirectiveDefinitions } from '@marp-team/marpit'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Parse a YAML / object value into a normalized JS value.
 * Front-matter may carry inline JSON-like objects, plain numbers, or quoted
 * strings; this normalizes all of them.
 */
function parseValue(v: unknown): unknown {
  if (v == null) return v
  if (typeof v !== 'string') return v
  const trimmed = v.trim()
  if (trimmed === '') return v
  // Try plain YAML (handles objects, numbers, booleans, strings with quotes)
  try {
    return yaml.load(trimmed)
  } catch {
    return v
  }
}

/** Ensure value is a plain object; return undefined otherwise. */
function asObject(v: unknown): Record<string, unknown> | undefined {
  const parsed = parseValue(v)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return undefined
}

/** Coerce to number; return undefined if not numeric. */
function asNumber(v: unknown): number | undefined {
  const parsed = parseValue(v)
  if (typeof parsed === 'number' && !Number.isNaN(parsed)) return parsed
  if (typeof parsed === 'string' && parsed !== '') {
    const n = Number(parsed)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

/** Coerce to boolean. */
function asBool(v: unknown): boolean | undefined {
  const parsed = parseValue(v)
  if (typeof parsed === 'boolean') return parsed
  if (typeof parsed === 'string') {
    const s = parsed.toLowerCase()
    if (s === 'true' || s === 'yes') return true
    if (s === 'false' || s === 'no' || s === '') return false
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Global directives (whole-deck)                                     */
/* ------------------------------------------------------------------ */

/**
 * Width / height / perspective / scale / autoplay / transition-duration
 * are exposed as root <div id="impress"> attributes by the host template.
 * They are stored here for two reasons:
 *  - To make the values inspectable via `lastGlobalDirectives`
 *  - So `info-plugin` (in the CLI) can read them for page size / PDF sizing
 */
export const globalDirectives: DirectiveDefinitions = {
  // Canvas size
  width: (v) => ({ width: asNumber(v) ?? String(v) }),
  height: (v) => ({ height: asNumber(v) ?? String(v) }),

  // Zoom limits
  maxScale: (v) => ({ maxScale: asNumber(v) }),
  minScale: (v) => ({ minScale: asNumber(v) }),

  // 3D perspective (0 disables 3D, falls back to 2D)
  perspective: (v) => ({ perspective: asNumber(v) }),

  // Transition duration (ms)
  transitionDuration: (v) => ({ transitionDuration: asNumber(v) }),

  // Auto play (seconds)
  autoplay: (v) => ({ autoplay: asNumber(v) }),

  // Heading-based auto split (passed through to Marpit)
  headingDivider: (v, marpit) => {
    const parsed = parseValue(v)
    if (marpit) marpit.options.headingDivider = parsed as any
    return { headingDivider: parsed }
  },

  // PDF output mode: per-step (one slide per page) or single (all on one page)
  pdfMode: (v) => {
    const s = String(parseValue(v) ?? 'per-step')
    return { pdfMode: s === 'single' ? 'single' : 'per-step' }
  },
}

/* ------------------------------------------------------------------ */
/* Local directives (per-slide)                                        */
/* ------------------------------------------------------------------ */

/**
 * Compound `position` directive — accepts a YAML / JSON object:
 *
 *     <!-- position: { x: 1500, y: 0, z: -3000 } -->
 *
 * The impress plugin later unwraps it into data-x / data-y / data-z.
 */
const positionDirective: DirectiveDefinitions[string] = (v) => {
  const obj = asObject(v)
  if (!obj) return {}
  const out: Record<string, number | undefined> = {}
  for (const k of ['x', 'y', 'z']) {
    const n = asNumber(obj[k])
    if (n != null) out[k] = n
  }
  return Object.keys(out).length ? { position: out } : {}
}

/**
 * Compound `rotate` directive — accepts a YAML / JSON object:
 *
 *     <!-- rotate: { x: 0, y: 0, z: 45, order: "xyz" } -->
 */
const rotateDirective: DirectiveDefinitions[string] = (v) => {
  const obj = asObject(v)
  if (!obj) return {}
  const out: Record<string, unknown> = {}
  for (const k of ['x', 'y', 'z']) {
    const n = asNumber(obj[k])
    if (n != null) out[k] = n
  }
  if (typeof obj.order === 'string') out.order = obj.order
  // Also support flat `rotate: 90` → rotate.z
  if (Object.keys(out).length === 0) {
    const flat = asNumber(v)
    if (flat != null) out.z = flat
  }
  return Object.keys(out).length ? { rotate: out } : {}
}

/** Flat scale override for the current step. */
const scaleDirective: DirectiveDefinitions[string] = (v) => {
  const n = asNumber(v)
  return n != null ? { scale: n } : {}
}

/** Per-step transition duration (ms); overrides the global value. */
const stepTransitionDurationDirective: DirectiveDefinitions[string] = (v) => {
  const n = asNumber(v)
  return n != null ? { transitionDuration: n } : {}
}

/** Relative positioning flag (delegated to impress.js's rel plugin). */
const relPositionDirective: DirectiveDefinitions[string] = (v) => {
  const b = asBool(v)
  return b != null ? { relPosition: b ? 'relative' : '' } : {}
}

/** Reference a previous step id for relative positioning. */
const relToDirective: DirectiveDefinitions[string] = (v) => {
  const s = String(parseValue(v) ?? '').trim()
  return s ? { relTo: s } : {}
}

export const localDirectives: DirectiveDefinitions = {
  position: positionDirective,
  rotate: rotateDirective,
  scale: scaleDirective,
  stepTransitionDuration: stepTransitionDurationDirective,
  relPosition: relPositionDirective,
  relTo: relToDirective,
}

/* ------------------------------------------------------------------ */
/* Installer                                                           */
/* ------------------------------------------------------------------ */

/** Register all mddeck directives onto a Marpit instance. */
export function registerDirectives(marpit: Marpit): void {
  for (const [key, def] of Object.entries(globalDirectives)) {
    marpit.customDirectives.global[key] = def as any
  }
  for (const [key, def] of Object.entries(localDirectives)) {
    marpit.customDirectives.local[key] = def as any
  }
}
