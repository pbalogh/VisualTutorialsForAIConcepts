import { useState, useEffect, useMemo } from 'react'

// Recursively extract all text strings from a JSON tutorial structure
function extractText(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj + ' '
  if (Array.isArray(obj)) return obj.map(extractText).join('')
  if (typeof obj === 'object') {
    let text = ''
    for (const [key, val] of Object.entries(obj)) {
      // Skip non-content keys
      if (['id', 'gradient', 'shadowColor', 'glowColor', 'icon', 'className', 'style', 'color', 'bgColor', 'borderColor'].includes(key)) continue
      text += extractText(val)
    }
    return text
  }
  return ''
}

export function useSearchIndex(tutorials) {
  const [contentIndex, setContentIndex] = useState(new Map())
  const [isBuilding, setIsBuilding] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function build() {
      const contentModules = import.meta.glob('../content/*.json')
      const index = new Map()

      await Promise.all(
        Object.entries(contentModules).map(async ([path, loader]) => {
          const filename = path.split('/').pop().replace('.json', '')
          try {
            const mod = await loader()
            const data = mod.default || mod
            index.set(filename, extractText(data).toLowerCase())
          } catch {}
        })
      )

      if (!cancelled) {
        setContentIndex(index)
        setIsBuilding(false)
      }
    }
    build()
    return () => { cancelled = true }
  }, [])

  const search = useMemo(() => {
    return (query) => {
      if (!query.trim()) return []
      const q = query.toLowerCase().trim()

      return tutorials
        .map(t => {
          const meta = `${t.title} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase()
          const content = contentIndex.get(t.id) || ''
          const full = meta + ' ' + content

          if (!full.includes(q)) return null

          // Find a matching excerpt from content
          let excerpt = ''
          const idx = content.indexOf(q)
          if (idx >= 0) {
            const start = Math.max(0, idx - 60)
            const end = Math.min(content.length, idx + q.length + 60)
            excerpt = (start > 0 ? '…' : '') + content.slice(start, end).trim() + (end < content.length ? '…' : '')
          } else {
            // Match was in meta only
            const mi = meta.indexOf(q)
            if (mi >= 0) {
              excerpt = meta.slice(Math.max(0, mi - 40), Math.min(meta.length, mi + q.length + 40)).trim()
            }
          }

          return { tutorial: t, excerpt }
        })
        .filter(Boolean)
    }
  }, [tutorials, contentIndex])

  return { search, isBuilding }
}
