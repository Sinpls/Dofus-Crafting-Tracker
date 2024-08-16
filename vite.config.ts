import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-electron-plugin'
import { customStart } from 'vite-electron-plugin/plugin'
import { loadEnv } from 'vite'
import * as path from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      electron({
        include: ['electron'],
        transformOptions: {
          sourcemap: !!process.env.VSCODE_DEBUG,
        },
        plugins: [
          customStart(debounce(() => console.log('electron-main-window-started'))),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    root: 'src',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/index.html'),
        },
      },
    },
    server: process.env.VSCODE_DEBUG ? (() => {
      const url = new URL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
      return {
        host: url.hostname,
        port: Number(url.port),
      }
    })() : undefined,
    clearScreen: false,
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    define: {
      'process.env': process.env
    },
  }
})

function debounce<Fn extends (...args: any[]) => void>(fn: Fn, delay = 299) {
  let t: NodeJS.Timeout
  return ((...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }) as Fn
}