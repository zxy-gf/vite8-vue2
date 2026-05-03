import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { createVuePlugin } from './build/plugns/vite-plugin-vue2-js'
import commonjs from 'vite-plugin-commonjs'

function scssDeepCompat() {
  return {
    name: 'scss-deep-compat',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('.scss') && !id.includes('lang.scss'))
        return
      if (!code.includes('/deep/'))
        return
      return {
        code: code.replace(/\/deep\//g, '::v-deep'),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [
    commonjs({
      filter(id) {
        return !id.includes('quill')
      },
    }),
    scssDeepCompat(),
    createVuePlugin({ jsx: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'public': fileURLToPath(new URL('./src/public', import.meta.url)),
      '~@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.vue'],
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'vuex',
      'element-ui',
      '@vue/babel-helper-vue-jsx-merge-props',
      'axios',
      'vuedraggable',
      'lodash',
      'moment',
      'localforage',
      'pinyin',
      'js-md5',
      'hash-sum'
    ],
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
        '.vue': 'jsx',
      },
    },
  },
  define: {
    'process.env': {
      PROXY_ENV: 'uat'
    }
  },
  legacy: {
    inconsistentCjsInterop: true
  },
  build: {
    lib: {
      entry: './main.js',
      name: 'Counter',
      fileName: 'counter',
    },
  },
})
