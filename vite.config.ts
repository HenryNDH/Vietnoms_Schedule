import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://henryndh.github.io/Vietnoms_Schedule/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'ghpages' ? '/Vietnoms_Schedule/' : '/',
}))
