import selfClosingTags from 'self-closing-tags'
import * as xss from 'xss'
import type { SafeAttrValueHandler, IWhiteList } from 'xss'
import type { HTMLAllowList } from './allowlist.js'

// NOTE: Rolldown MJS build will fail if used named import directly
const { FilterXSS, friendlyAttrValue, escapeAttrValue } = xss

const selfClosingRegexp = /\s*\/?>$/
const xhtmlOutFilter = new FilterXSS({
  onIgnoreTag: (tag, html, { isClosing }: any) => {
    if (selfClosingTags.includes(tag)) {
      const attrs = html.slice(tag.length + (isClosing ? 2 : 1), -1).trim()
      return `<${tag} ${attrs}>`.replace(selfClosingRegexp, ' />')
    }
    return html
  },
  allowList: {},
})

// Prevent breaking JavaScript special characters such as `<` and `>` by HTML
// escape process only if the entire content of HTML block is consisted of
// script tag (The case of matching the case 1 of https://spec.commonmark.org/0.31.2/#html-blocks,
// with special condition for <script> tag)
//
// For cases like https://spec.commonmark.org/0.31.2/#example-178, which do not
// end the HTML block with `</script>`, that will not exclude from sanitizing.
//
const scriptBlockRegexp =
  /^<script(?:>|[ \t\f\n\r][\s\S]*?>)([\s\S]*)<\/script>[ \t\f\n\r]*$/i

const scriptBlockContentUnexpectedCloseRegexp = /<\/script[>/\t\f\n\r ]/i

const isValidScriptBlock = (htmlBlockContent: string) => {
  const m = htmlBlockContent.match(scriptBlockRegexp)
  return !!(m && !scriptBlockContentUnexpectedCloseRegexp.test(m[1]))
}

export function markdown(md): void {
  const { html_inline, html_block } = md.renderer.rules

  const fetchHtmlOption = (): boolean | HTMLAllowList => md.options.html
  const fetchAllowList = (html = fetchHtmlOption()): IWhiteList => {
    const allowList: IWhiteList = Object.create(null)

    if (typeof html === 'object') {
      for (const tag of Object.keys(html)) {
        const attrs = html[tag]

        if (Array.isArray(attrs)) {
          allowList[tag] = attrs
        } else if (typeof attrs === 'object') {
          allowList[tag] = Object.keys(attrs).filter(
            (attr) => attrs[attr] !== false,
          )
        }
      }
    }
    return allowList
  }

  const generateSafeAttrValueHandler =
    (html = fetchHtmlOption()): SafeAttrValueHandler =>
    (tag, attr, value) => {
      let ret = friendlyAttrValue(value)

      if (
        typeof html === 'object' &&
        html[tag] &&
        !Array.isArray(html[tag]) &&
        typeof html[tag][attr] === 'function'
      ) {
        ret = html[tag][attr](ret)
      }

      return escapeAttrValue(ret)
    }

  const sanitize = (ret: string) => {
    const html = fetchHtmlOption()
    const filter = new FilterXSS({
      allowList: fetchAllowList(html),
      onIgnoreTag: (_, rawHtml) => (html === true ? rawHtml : undefined),
      safeAttrValue: generateSafeAttrValueHandler(html),
    })

    const sanitized = filter.process(ret)
    return md.options.xhtmlOut ? xhtmlOutFilter.process(sanitized) : sanitized
  }

  md.renderer.rules.html_inline = (...args: unknown[]) => sanitize(html_inline(...(args as Parameters<typeof html_inline>)))
  md.renderer.rules.html_block = (...args: unknown[]): string => {
    const ret = html_block(...(args as Parameters<typeof html_block>)) as string
    const html = fetchHtmlOption()

    const scriptAllowAttrs: string[] | undefined = (() => {
      if (html === true) return []
      if (typeof html === 'object' && html['script'])
        return fetchAllowList({ script: html.script }).script as string[]
      return undefined
    })()

    // If the entire content of HTML block is consisted of script tag when the
    // script tag is allowed, we will not escape the content of the script tag.
    if (scriptAllowAttrs && isValidScriptBlock(ret)) {
      const scriptFilter = new FilterXSS({
        allowList: { script: scriptAllowAttrs || [] },
        allowCommentTag: true,
        onIgnoreTagAttr: (_, name, value) => {
          if (html === true) return `${name}="${escapeAttrValue(value)}"`
          return undefined
        },
        escapeHtml: (s) => s,
        safeAttrValue: generateSafeAttrValueHandler(html),
      })

      return scriptFilter.process(ret)
    }

    return sanitize(ret)
  }
}
