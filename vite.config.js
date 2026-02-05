import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use subpath for GitHub Pages, root for Netlify/local
const base = process.env.GITHUB_ACTIONS ? '/VisualTutorialsForAIConcepts/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5184,
    open: true
  }
})
