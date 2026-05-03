import fs from 'fs'
import { createFilter } from '@rollup/pluginutils'
import { parse } from '@babel/parser'
import { normalizeComponentCode } from './utils/componentNormalizer'
import { vueHotReloadCode } from './utils/vueHotReload'
import { parseVueRequest } from './utils/query'
import { transformMain } from './main'
import { compileSFCTemplate } from './template'
import { getDescriptor } from './utils/descriptorCache'
import { transformStyle } from './style'
import { handleHotUpdate as handleHotUpdateFn } from './hmr'
import { transformVueJsx } from './jsxTransform'

export const vueComponentNormalizer = '\0/vite/vueComponentNormalizer'
export const vueHotReload = '\0/vite/vueHotReload'

function hasJsx(code, id) {
  if (!code.includes('<'))
    return false

  let ast
  try {
    ast = parse(code, {
      sourceType: 'module',
      sourceFilename: id,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'dynamicImport',
      ],
    })
  }
  catch {
    return false
  }

  const stack = [ast]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object')
      continue

    if (node.type === 'JSXElement' || node.type === 'JSXFragment')
      return true

    for (const key in node) {
      const value = node[key]
      if (!value)
        continue
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const child = value[i]
          if (child && typeof child === 'object')
            stack.push(child)
        }
      }
      else if (typeof value === 'object') {
        stack.push(value)
      }
    }
  }

  return false
}

export function createVuePlugin(rawOptions = {}) {
  const options = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    root: process.cwd(),
  }

  const filter = createFilter(options.include || /\.vue$/, options.exclude)
  const jsxFilter = createFilter(
    options.jsxInclude || [/\.(jsx|tsx)$/, /jsx/],
    options.jsxExclude || /node_modules/,
  )

  return {
    name: 'vite-plugin-vue2',

    config() {
      if (options.jsx) {
        return {
          oxc: {
            jsx: 'preserve',
            include: /\.ts$/,
            exclude: /\.(tsx|jsx)$/,
          },
        }
      }
    },

    handleHotUpdate(ctx) {
      if (!filter(ctx.file))
        return

      return handleHotUpdateFn(ctx, options)
    },

    configResolved(config) {
      options.isProduction = config.isProduction
      options.root = config.root
    },

    configureServer(server) {
      options.devServer = server
    },

    async resolveId(id) {
      if (id === vueComponentNormalizer || id === vueHotReload)
        return id

      // serve subpart requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue)
        return id
    },

    load(id) {
      if (id === vueComponentNormalizer)
        return normalizeComponentCode

      if (id === vueHotReload)
        return vueHotReloadCode

      const { filename, query } = parseVueRequest(id)
      // select corresponding block for subpart virtual modules
      if (query.vue) {
        if (query.src)
          return fs.readFileSync(filename, 'utf-8')

        const descriptor = getDescriptor(filename)
        let block

        if (query.type === 'script')
          block = descriptor.script
        else if (query.type === 'template')
          block = descriptor.template
        else if (query.type === 'style')
          block = descriptor.styles[query.index]
        else if (query.index != null)
          block = descriptor.customBlocks[query.index]

        if (block) {
          return {
            code: block.content,
            map: block.map,
          }
        }
      }
    },

    async transform(code, id) {
      const { filename, query } = parseVueRequest(id)

      if (options.jsx) {
        const langJsx = 'lang.jsx' in query || 'lang.tsx' in query
        const extMatch = /\.(tsx|jsx)$/.test(filename)
        const includeMatch = jsxFilter(filename)
        const autoMatch = !query.vue && /\.(ts|js)$/.test(filename) && hasJsx(code, id)
        if (langJsx || extMatch || includeMatch || autoMatch)
          return transformVueJsx(code, id, options.jsxOptions)
      }

      if ((!query.vue && !filter(filename)) || query.raw)
        return

      if (!query.vue) {
        // main request
        const result = await transformMain(code, filename, options, this)
        if (options.jsx && result?.code && hasJsx(result.code, id))
          return transformVueJsx(result.code, id, options.jsxOptions)

        return result
      }

      const descriptor = getDescriptor(
        query.from ? decodeURIComponent(query.from) : filename,
      )
      // sub block request
      if (query.type === 'template') {
        return compileSFCTemplate(
          code,
          descriptor.template,
          filename,
          options,
          this,
        )
      }
      if (query.type === 'style') {
        return await transformStyle(
          code,
          filename,
          descriptor,
          Number(query.index),
          this,
        )
      }
    },
  }
}
