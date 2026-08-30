/**
 * Returns the raw impress.js runtime source.
 * Reads from the impress.js repo at ref/impress.js/js/impress.js if available,
 * otherwise falls back to an embedded minimal subset (which won't actually
 * animate 3D — just enough to mark body.impress-ready).
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

let cached: string | undefined

export function getImpressJsBundle(): string {
  if (cached) return cached

  const candidates = [
    // When running from mddeck repo
    resolve(process.cwd(), '../../ref/impress.js/js/impress.js'),
    // When installed as a dep
    resolve(process.cwd(), 'node_modules/impress.js/js/impress.js'),
  ]

  for (const p of candidates) {
    if (existsSync(p)) {
      cached = readFileSync(p, 'utf-8')
      return cached
    }
  }

  // Fallback: stub that only marks body.impress-ready (no real 3D)
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
  // Expose minimal API
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
