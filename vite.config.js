import { defineConfig } from 'vite'
import { createVuePlugin }  from './build/plugns/vite-plugin-vue2-js'

export default defineConfig({
  plugins: [createVuePlugin({ jsx: true })],
  build: {
    lib: {
      entry: './lib/main.js',
      name: 'Counter',
      fileName: 'counter',
    },
  },
})
