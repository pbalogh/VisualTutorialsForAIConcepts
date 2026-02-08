import React, { useState, useEffect, useRef } from 'react'

/**
 * Version History Dropdown Component
 * 
 * Shows version history for a tutorial and allows browsing/restoring old versions.
 * Structure-agnostic — works with any file type.
 */
export default function VersionDropdown({ tutorialId, onVersionChange }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load versions when dropdown opens
  useEffect(() => {
    if (open && versions.length === 0) {
      loadVersions()
    }
  }, [open])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:5190/api/versions?tutorialId=${tutorialId}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch (err) {
      console.error('Failed to load versions:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSnapshot = async () => {
    setCreating(true)
    try {
      const res = await fetch('http://localhost:5190/api/versions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId, message: 'Manual snapshot' })
      })
      if (res.ok) {
        await loadVersions()
      }
    } catch (err) {
      console.error('Failed to create snapshot:', err)
    } finally {
      setCreating(false)
    }
  }

  const restoreVersion = async (index) => {
    if (!confirm(`Restore to this version? Current state will be saved first.`)) return
    
    try {
      const res = await fetch('http://localhost:5190/api/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId, index })
      })
      if (res.ok) {
        setOpen(false)
        onVersionChange?.() // Refresh parent
      }
    } catch (err) {
      console.error('Failed to restore version:', err)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // If today, show time
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }
    
    // If yesterday
    if (diff < 48 * 60 * 60 * 1000) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const getTriggerIcon = (trigger) => {
    switch (trigger) {
      case 'regroup': return '🔄'
      case 'annotation': return '💬'
      case 'restore': return '↩️'
      case 'manual': return '📸'
      default: return '📌'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 text-sm font-medium transition-all border border-gray-700/50"
      >
        <span>📜</span>
        <span>History</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white font-medium">Version History</span>
            <button
              onClick={createSnapshot}
              disabled={creating}
              className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors"
            >
              {creating ? '...' : '+ Save Now'}
            </button>
          </div>

          {/* Version list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="mb-2">No versions yet</div>
                <div className="text-xs text-gray-600">
                  Versions are created automatically when you regroup annotations
                </div>
              </div>
            ) : (
              versions.map((v, idx) => (
                <div 
                  key={v.timestamp}
                  className="px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{getTriggerIcon(v.trigger)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{v.message}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatTime(v.timestamp)}</div>
                    </div>
                    <button
                      onClick={() => restoreVersion(versions.length - 1 - idx)}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {versions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
              {versions.length} version{versions.length !== 1 ? 's' : ''} • Max 20 kept
            </div>
          )}
        </div>
      )}
    </div>
  )
}
