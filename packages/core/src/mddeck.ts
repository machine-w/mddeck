/**
 * MdDeck — Main public class for the mddeck core library.
 *
 * Extends Marpit (the marp-team markdown slide framework) and:
 *   - Registers mddeck-specific directives (position/rotate/scale/...)
 *   - Installs the `mddeck_impress` markdown-it plugin (rewrites <section>
 *     tokens into <div class="step" data-* ...> for impress.js)
 *   - Installs the auto-layout plugin (assigns 3D positions to steps that
 *     didn't specify `position:` so they don't overlap)
 *   - Exposes a `printable` mode that injects CSS to flatten the 3D layout
 *     for PDF export
 *
 * Usage:
 *   import { MdDeck } from '@machine-w/mddeck-core'
 *   const md = new MdDeck({ theme: 'default' })
 *   const { html, css } = md.render('# Hello\n---\n# World')
 */

import { Element, Marpit as MarpitBase } from '@marp-team/marpit'
import type { Marpit as MarpitType } from '@marp-team/marpit'

import { mddeckImpress } from './markdown/impress.js'
import { registerDirectives } from './markdown/directives.js'
import { autoLayoutPlugin } from './markdown/auto_layout.js'
import { printModePlugin } from './markdown/print_mode.js'
import stepReplacePostcss from './postcss/step_replace.js'
import scaffoldInjectPostcss from './postcss/scaffold_inject.js'
import { builtinThemes } from './themes/index.js'

// Modules vendored from @marp-team/marp-core (lightly adapted for mddeck)
import * as htmlPlugin from './html/html.js'
import { defaultHTMLAllowList, type HTMLAllowList } from './html/allowlist.js'
import * as emojiPlugin from './emoji/emoji.js'
import * as mathPlugin from './math/math.js'
import * as slugPlugin from './slug/slug.js'
import * as sizePlugin from './size/size.js'
import * as autoScalingPlugin from './auto-scaling/index.js'

export interface MdDeckOptions {
  /** Theme name registered via `themeSet.add()`. Default: 'default'. */
  theme?: string
  /** Enable PDF-printable output (flattens 3D). Default: false. */
  printable?: boolean
  /** Override default canvas width (px). Default: 1920. */
  width?: number
  /** Override default canvas height (px). Default: 1080. */
  height?: number
  /** Override default perspective. Default: 1000. */
  perspective?: number
  /** When true, auto-assign 3D positions to steps without an explicit
   *  `position:` directive. Default: true. */
  autoLayout?: boolean
  /** Math engine: 'mathjax' (default), 'katex', or false. */
  math?: false | 'mathjax' | 'katex' | mathPlugin.MathOptions
  /** Emoji options. */
  emoji?: emojiPlugin.EmojiOptions
  /** Heading slug options. */
  slug?: slugPlugin.SlugOptions
  /** HTML allowlist (false = escape all HTML, true = allow all, object = custom allowlist).
   *  Default: marp-core's defaultHTMLAllowList. */
  html?: boolean | HTMLAllowList
}

/**
 * Custom Element factory — the wrapper element that the host template will
 * inject into. We keep the name as 'div' so it renders as `<div class="marpit">`
 * by default; the CLI's templates override the id to 'impress'.
 */
const mddeckContainer = new Element('div', { class: 'marpit mddeck' })
const mddeckSlideContainer = new Element('div', { class: 'mddeck-slide-container' })

/** Per-instance options lookup (avoids relying on `this._opts` during
 *  applyMarkdownItPlugins which runs before user property assignments).
 *  Keyed by `this` (the MdDeck instance) — populated in the constructor
 *  body (after super()) and the very first applyMarkdownItPlugins call
 *  inside Marpit's super() will simply skip if the entry is missing. */
const mddeckOptsByInstance = new WeakMap<object, MdDeckOptions>()

/** Per-instance set of math libraries that need to be loaded lazily
 *  (katex / mathjax) before the next render. Populated in the constructor
 *  and consumed by renderAsString / renderDocument. */
const mddeckPendingMathLibs = new WeakMap<object, Promise<void>>()

export class MdDeck extends MarpitBase {
  /** Holds the resolved size, exposed for CLI / VSCode consumers. */
  public sizeInfo: { width: number; height: number; perspective: number } = {
    width: 1920,
    height: 1080,
    perspective: 1000,
  }

  constructor(opts: MdDeckOptions = {}) {
    super({
      container: [mddeckContainer],
      slideContainer: [mddeckSlideContainer],
      printable: opts.printable ?? false,
      looseYAML: true,
      // Disable inlineSVG — we don't need pixel-perfect SVG scaling because
      // impress.js handles 3D scaling in CSS, and SVG wrapping would conflict
      // with our step token rewrite.
      inlineSVG: false,
    })

    // Store opts on the WeakMap AFTER super() so it runs after Marpit's
    // internal applyMarkdownItPlugins() call. Our plugin override checks
    // the WeakMap; if missing, it skips — then this code runs as a no-op.
    // To ensure the katex plugin is registered, we explicitly call our own
    // setup logic here using `opts` directly.
    mddeckOptsByInstance.set(this as any, opts)
    this.#setupSubPlugins(this.markdown as any, opts)

    // Theme meta types — needed for `size:` and `auto-scaling:` directives
    this.themeSet.metaType = Object.freeze({
      'auto-scaling': String,
      size: Array,
    } as any)

    // Register mddeck-specific directives on this instance
    registerDirectives(this)

    // Register built-in themes (no scaffold here — it's injected via PostCSS)
    for (const t of builtinThemes) {
      this.themeSet.add(t.css)
    }
    // Set default theme
    this.themeSet.default = this.themeSet.get('default') ?? this.themeSet.add(builtinThemes[0].css)

    // Install impress plugin (rewrites <section> → <div class="step">)
    this.use(mddeckImpress)

    // Install auto-layout (assigns positions to steps without explicit pos)
    if (opts.autoLayout !== false) this.use(autoLayoutPlugin)

    // Install print mode CSS injection when printable: true
    if (opts.printable) this.use(printModePlugin)

    // Install PostCSS plugin that rewrites `section` → `.step` selectors in
    // the packed theme CSS (Marpit's scaffold and built-in directives still
    // emit `section` rules, but we render <div class="step">).
    this.use(stepReplacePostcss)
    // Install PostCSS plugin that injects our own scaffold CSS (with .step
    // selectors, --mddeck-* CSS vars, and the fallback-message hide rule).
    this.use(scaffoldInjectPostcss)

    // Apply user-provided size info to sizeInfo + options
    const w = opts.width ?? 1920
    const h = opts.height ?? 1080
    const p = opts.perspective ?? 1000
    this.sizeInfo = { width: w, height: h, perspective: p }

    // Store user-provided sub-options for applyMarkdownItPlugins override.
    // Marpit's constructor calls applyMarkdownItPlugins during super(),
    // so we already set the WeakMap entry BEFORE super() above. Setting it
    // again here is idempotent and covers the case where someone creates an
    // instance via subclass.
    mddeckOptsByInstance.set(this as any, opts)

    // Configure markdown-it's html option so html.ts sanitizer kicks in.
    // Default is the marp-core allowlist (allows safe tags, sanitizes everything else).
    if (opts.html !== undefined) {
      this.markdown.set({ html: opts.html as any })
    } else {
      this.markdown.set({ html: defaultHTMLAllowList as any })
    }

    // Install the marp-core vendored markdown plugins (html / emoji / math /
    // auto-scaling / size / slug). Marpit's constructor calls
    // applyMarkdownItPlugins during super() but we skip it there (WeakMap
    // not yet populated), so we explicitly install these plugins now.
    this.use(htmlPlugin.markdown)
      .use(emojiPlugin.markdown)
      .use(mathPlugin.markdown)
      .use(autoScalingPlugin.markdown)
      .use(sizePlugin.markdown)
      .use(slugPlugin.markdown)
  }

  /**
   * Override marpit's themeSet.pack() options to inject emoji CSS and math
   * CSS into the packed theme stylesheet.
   */
  protected themeSetPackOptions(): any {
    const base = super.themeSetPackOptions() as any

    const userOpts = mddeckOptsByInstance.get(this as any) ?? ({} as MdDeckOptions)

    const emojiCSS = emojiPlugin.css(
      ({ shortcode: 'twemoji', unicode: 'twemoji', ...(userOpts.emoji ?? {}) } as any),
    )
    if (emojiCSS) base.before = (base.before ?? '') + emojiCSS + '\n'

    const mathCSS = mathPlugin.css(this as any)
    if (mathCSS) base.before = (base.before ?? '') + mathCSS + '\n'

    return base
  }

  /**
   * Override marpit's plugin chain to register the marp-core modules
   * (html / emoji / math / auto-scaling / size / slug) that mddeck vendors.
   *
   * Order is critical:
   *   1. mddeck_impress (rewrites <section> → <div class="step">) — must run
   *      AFTER marpit's slide plugin (which creates <section> tokens) and
   *      AFTER directives apply (so we can read position/rotate/etc.)
   *   2. mddeck_auto_layout — runs after impress to fill in missing positions.
   *   3. mddeck_print_mode — appends CSS when printable: true.
   *   4. Marp-core modules — html sanitization, emoji, math, auto-scaling,
   *      size, slug. Their relative order matches marp-core/marp.ts:94-100.
   */
  protected applyMarkdownItPlugins(md: any): void {
    super.applyMarkdownItPlugins(md)
    // (We let Marpit install its own internal plugins above; they must only
    // be installed once. The marp-core vendored plugins are installed
    // separately in the constructor body so they're available for render
    // calls that happen before any post-construction hook.)
    const userOpts = mddeckOptsByInstance.get(this as any)
    if (!userOpts) return
    this.#setupSubPlugins(md, userOpts)
  }

  /**
   * Configure `_mddeck*Option` fields on the marpit instance. Math library
   * plugins (katex / mathjax) are loaded LAZILY before each render, since
   * they're ESM modules that can't be `require()`-d synchronously.
   */
  #setupSubPlugins(md: any, opts: MdDeckOptions): void {
    const marpit = md.marpit as any

    // Emoji: default to twemoji, override with user opts
    marpit._mddeckEmojiOption = {
      shortcode: 'twemoji',
      unicode: 'twemoji',
      ...(opts.emoji ?? {}),
    }

    if (opts.math !== undefined) {
      marpit._mddeckMathOption = opts.math
    }
    if (opts.slug !== undefined) {
      marpit._mddeckSlugOption = opts.slug
    }
  }

  /** Lazy-load the math library plugin (katex by default) and register it
   *  on the markdown instance. Cached per-instance so it only loads once. */
  async #loadMathLibIfNeeded(): Promise<void> {
    const cached = mddeckPendingMathLibs.get(this as any)
    if (cached) return cached
    const opts = mddeckOptsByInstance.get(this as any)
    if (!opts || opts.math === undefined || opts.math === false) return

    const libName =
      typeof opts.math === 'string' ? opts.math : (opts.math as any).lib
    if (libName !== 'katex' && libName !== undefined) return // mathjax path is opt-in

    const promise = (async () => {
      try {
        // Resolve the katex plugin via the package exports map. This works
        // in both vitest (vite-node) and the compiled dist output.
        // @ts-ignore — runtime-only import via package exports
        const mod = await import('@machine-w/mddeck-core/plugins_katex/index.js')
        mod.katexMarpCorePlugin()(this.markdown as any)
      } catch (err) {
        console.warn(
          '[mddeck] Failed to load katex math plugin. ' +
            'Install the `katex` package. Falling back to escaped LaTeX.',
          err,
        )
      }
    })()
    mddeckPendingMathLibs.set(this as any, promise)
    return promise
  }

  // render() is inherited from Marpit; do not override to keep TS overloads happy.
  // Callers should treat returned `html` as `string | string[]`.

  /**
   * Convenience wrapper that returns the rendered slide HTML as plain string.
   * When env.htmlAsArray is true the array is joined with '\n'.
   */
  async renderAsString(
    markdown: string,
    env?: { htmlAsArray?: boolean },
  ): Promise<{
    html: string
    css: string
    comments: string[][]
  }> {
    await this.#loadMathLibIfNeeded()
    const result = super.render(markdown, env)
    return {
      html: Array.isArray(result.html) ? result.html.join('\n') : result.html,
      css: result.css,
      comments: result.comments,
    }
  }

  /**
   * Render a complete single-file HTML document by combining the slide HTML
   * with theme CSS and an inline impress.js runtime.
   *
   * The actual impress.js bundle is supplied by the caller (the CLI or
   * VSCode extension), since bundling impress.js itself is the host's
   * responsibility.
   */
  async renderDocument(opts: {
    markdown: string
    title?: string
    author?: string
    /** Raw JS source of impress.js (will be inlined in a <script> tag). */
    impressJsBundle: string
    /** Extra CSS to inject (e.g. print mode override). */
    extraCss?: string
    /** When true, inject print mode (flatten 3D). */
    printable?: boolean
  }): Promise<string> {
    await this.#loadMathLibIfNeeded()
    const { html, css, comments } = await this.renderAsString(opts.markdown)
    const sizeW = this.sizeInfo.width
    const sizeH = this.sizeInfo.height
    const persp = this.sizeInfo.perspective
    const printable = opts.printable ?? false

    const extraCss = opts.extraCss ?? ''
    const title = escapeHtml(opts.title ?? 'mddeck presentation')
    const author = opts.author ? `<meta name="author" content="${escapeHtml(opts.author)}">` : ''

    const printCss = printable
      ? `
#impress { perspective: none !important; transform-style: flat !important; }
.step { position: relative !important; transform: none !important;
        transform-origin: 50% 50% !important; }
`
      : ''

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${author}
<style>
${css}
${extraCss}
${printCss}
</style>
</head>
<body class="impress-not-supported">
<div class="fallback-message">
  <p>Your browser does not support impress.js. Please use a modern browser.</p>
</div>
<div id="impress"
     data-transition-duration="${this.lastGlobalDirectives?.transitionDuration ?? 1000}"
     data-width="${sizeW}"
     data-height="${sizeH}"
     data-max-scale="${this.lastGlobalDirectives?.maxScale ?? 3}"
     data-min-scale="${this.lastGlobalDirectives?.minScale ?? 0}"
     data-perspective="${persp}"
     ${this.lastGlobalDirectives?.autoplay ? `data-autoplay="${this.lastGlobalDirectives.autoplay}"` : ''}>
${html}
</div>
<script>${opts.impressJsBundle}</script>
<script>
(function(){
  // Auto-init impress.js after DOM is ready, then mark body as impress-ready
  function init() {
    try {
      var api = window.impress();
      if (api && typeof api.init === 'function') {
        api.init();
        document.body.classList.add('impress-ready');
        document.body.classList.remove('impress-not-supported');
      }
    } catch (e) {
      console.error('mddeck: impress.js init failed', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
</body>
</html>`
  }

  /** Convenience accessor for `lastComments` (defined by Marpit). */
  get lastCommentsArray(): string[][] | undefined {
    return (this as any).lastComments
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
