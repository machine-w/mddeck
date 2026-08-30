import { marpPlugin } from '../marpp_plugin.js'
import { codeBlockPlugin } from './code-block.js'
import { fittingHeaderPlugin } from './fitting-header.js'

export const markdown = marpPlugin((md) =>
  md.use(fittingHeaderPlugin).use(codeBlockPlugin),
)
