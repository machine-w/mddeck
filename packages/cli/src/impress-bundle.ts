/**
 * Returns the raw impress.js runtime source.
 *
 * The CLI ships impress.js as a built-in asset at
 *   <this-file's-dir>/../media/impress.js
 * so the rendered HTML actually contains the real runtime — without
 * it the slides have no 3D positioning logic, no keyboard navigation,
 * no transition animation, and the first step lands in the bottom-
 * right corner of the viewport.
 *
 * Resolution order:
 *   1. media/impress.js bundled next to this source (preferred —
 *      works in dev, in the published npm tarball, and when
 *      installed globally).
 *   2. ref/impress.js/js/impress.js (legacy dev-repo layout).
 *   3. node_modules/impress.js (if user installed it manually).
 *   4. Embedded stub — no real 3D; only flips the body class so the
 *      fallback overlay disappears. Documented as a last resort.
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

let cached: string | undefined

export function getImpressJsBundle(): string {
  if (cached) return cached

  // import.meta.url points at impress-bundle.js (the compiled output),
  // whose parent directory is dist/. Going up one level lands on the
  // package root, where the impress.js source is published under
  // media/.
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    // 1. Bundled with the CLI package (preferred).
    resolve(here, '..', 'media', 'impress.js'),
    // 2. Legacy dev-repo layout (when running from the mddeck source
    //    repo, before the publish step has copied the file).
    resolve(here, '..', '..', '..', 'ref', 'impress.js', 'js', 'impress.js'),
    // 3. User-installed impress.js (in case someone added it as a dep).
    resolve(here, '..', 'node_modules', 'impress.js', 'js', 'impress.js'),
  ]

  for (const p of candidates) {
    if (existsSync(p)) {
      cached = readFileSync(p, 'utf-8')
      return cached
    }
  }

  // 4. Embedded stub — last-resort. Documented for the user; if they
  //    see this in their output they should reinstall the package.
  cached = `
// Minimal impress.js stub (install impress.js for full 3D rendering)
(function() {
  function init() {
    document.body.classList.remove('impress-not-supported');
    document.body.classList.add('impress-supported', 'impress-ready');
    document.getElementById('impress').classList.add('impress-on-step-1');
    document.querySelectorAll('.step').forEach(function(el, i) {
      if (i === 0) el.classList.add('active', 'present');
      else el.classList.add('future');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.impress = function() {
    return {
      init: init,
      goto: function(el) {
        document.querySelectorAll('.step').forEach(function(s) {
          s.classList.remove('active', 'present');
          s.classList.add('past');
        });
        el.classList.remove('past', 'future');
        el.classList.add('active', 'present');
      },
      next: function() {},
      prev: function() {},
    };
  };
})();
`
  return cached
}