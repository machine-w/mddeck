/* preview-runtime.js — runs impress().init() and reports body.impress-ready. */
(function () {
  function init() {
    try {
      if (typeof impress !== 'function') {
        console.error('mddeck preview: impress.js is not loaded')
        return
      }
      const api = impress()
      api.init()
      document.body.classList.remove('impress-not-supported')
      document.body.classList.add('impress-ready')
    } catch (err) {
      console.error('mddeck preview: impress init failed', err)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
