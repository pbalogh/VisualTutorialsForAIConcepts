import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

// Use subpath for GitHub Pages, root for Netlify/local
const base = process.env.GITHUB_ACTIONS ? '/VisualTutorialsForAIConcepts/' : '/'

/**
 * Vite plugin: generates a virtual module with tutorial timestamps.
 * import timestamps from 'virtual:tutorial-timestamps'
 * → { "tutorial-id": "2026-02-24T19:02:29-05:00", ... }
 */
function tutorialTimestamps() {
  const virtualId = 'virtual:tutorial-timestamps'
  const resolvedId = '\0' + virtualId

  return {
    name: 'tutorial-timestamps',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return null

      const contentDir = join(process.cwd(), 'src', 'content')
      const timestamps = {}

      try {
        const files = readdirSync(contentDir).filter(f => f.endsWith('.json'))
        for (const file of files) {
          const tutorialId = file.replace('.json', '')
          try {
            // Try git first (last commit date for this file)
            const gitDate = execSync(
              `git log -1 --format=%aI -- "src/content/${file}"`,
              { encoding: 'utf-8', timeout: 5000 }
            ).trim()
            if (gitDate) {
              timestamps[tutorialId] = gitDate
              continue
            }
          } catch {}
          // Fallback to file mtime
          try {
            const stat = statSync(join(contentDir, file))
            timestamps[tutorialId] = stat.mtime.toISOString()
          } catch {}
        }

        // Also check JSX tutorials
        const tutorialsDir = join(process.cwd(), 'src', 'tutorials')
        try {
          const jsxFiles = readdirSync(tutorialsDir).filter(f => f.endsWith('.jsx'))
          for (const file of jsxFiles) {
            const name = file.replace('.jsx', '')
            // Convert PascalCase to kebab-case for matching
            const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            if (!timestamps[kebab]) {
              try {
                const gitDate = execSync(
                  `git log -1 --format=%aI -- "src/tutorials/${file}"`,
                  { encoding: 'utf-8', timeout: 5000 }
                ).trim()
                if (gitDate) timestamps[kebab] = gitDate
              } catch {}
            }
          }
        } catch {}
      } catch (e) {
        console.warn('tutorial-timestamps plugin: failed to scan content dir', e)
      }

      return `export default ${JSON.stringify(timestamps)}`
    }
  }
}

export default defineConfig({
  plugins: [react(), tutorialTimestamps()],
  base,
  server: {
    port: 5184,
    open: true
  }
})
