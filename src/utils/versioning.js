/**
 * Structure-agnostic file versioning system
 * 
 * Versions are stored as full file snapshots in a .versions/ directory
 * alongside the content directory. This approach:
 * - Works for any file type (tutorials, trees, quizzes, etc.)
 * - Doesn't couple to internal JSON structure
 * - Simple to understand and maintain
 */

import fs from 'fs/promises'
import path from 'path'

const DEFAULT_MAX_VERSIONS = 20

/**
 * Get the versions directory for a given file
 * e.g., src/content/foo.json -> src/content/.versions/foo/
 */
export function getVersionsDir(filePath) {
  const dir = path.dirname(filePath)
  const basename = path.basename(filePath, path.extname(filePath))
  return path.join(dir, '.versions', basename)
}

/**
 * Get the manifest path for a versions directory
 */
function getManifestPath(versionsDir) {
  return path.join(versionsDir, 'manifest.json')
}

/**
 * Load or create manifest for a file's versions
 */
async function loadManifest(versionsDir) {
  const manifestPath = getManifestPath(versionsDir)
  try {
    const data = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { versions: [], maxVersions: DEFAULT_MAX_VERSIONS }
    }
    throw err
  }
}

/**
 * Save manifest
 */
async function saveManifest(versionsDir, manifest) {
  const manifestPath = getManifestPath(versionsDir)
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}

/**
 * Generate timestamp-based filename
 */
function generateVersionFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-') + '.json'
}

/**
 * Create a new version snapshot of a file
 * 
 * @param {string} filePath - Path to the file to version
 * @param {string} message - Human-readable description
 * @param {string} trigger - What caused this: 'manual' | 'regroup' | 'annotation' | 'tree-op' | 'import'
 * @returns {object} - Version info { timestamp, message, trigger, filename }
 */
export async function createVersion(filePath, message = 'Snapshot', trigger = 'manual') {
  const versionsDir = getVersionsDir(filePath)
  
  // Ensure versions directory exists
  await fs.mkdir(versionsDir, { recursive: true })
  
  // Load manifest
  const manifest = await loadManifest(versionsDir)
  
  // Generate version filename and copy current file
  const filename = generateVersionFilename()
  const versionPath = path.join(versionsDir, filename)
  
  await fs.copyFile(filePath, versionPath)
  
  // Add to manifest
  const versionInfo = {
    timestamp: new Date().toISOString(),
    message,
    trigger,
    filename
  }
  manifest.versions.push(versionInfo)
  
  // Prune old versions if over limit
  const maxVersions = manifest.maxVersions || DEFAULT_MAX_VERSIONS
  while (manifest.versions.length > maxVersions) {
    const oldest = manifest.versions.shift()
    try {
      await fs.unlink(path.join(versionsDir, oldest.filename))
    } catch (err) {
      console.warn(`Could not delete old version ${oldest.filename}:`, err.message)
    }
  }
  
  // Save updated manifest
  await saveManifest(versionsDir, manifest)
  
  console.log(`📸 Version created: ${message} (${trigger})`)
  return versionInfo
}

/**
 * List all versions for a file
 * 
 * @param {string} filePath - Path to the file
 * @returns {array} - Array of version info objects, newest first
 */
export async function listVersions(filePath) {
  const versionsDir = getVersionsDir(filePath)
  const manifest = await loadManifest(versionsDir)
  
  // Return newest first
  return [...manifest.versions].reverse()
}

/**
 * Get a specific version's content
 * 
 * @param {string} filePath - Path to the current file
 * @param {number} index - Version index (0 = oldest, -1 = newest before current)
 * @returns {object} - { content: parsed JSON, versionInfo }
 */
export async function getVersion(filePath, index) {
  const versionsDir = getVersionsDir(filePath)
  const manifest = await loadManifest(versionsDir)
  
  // Handle negative indices
  let actualIndex = index
  if (index < 0) {
    actualIndex = manifest.versions.length + index
  }
  
  if (actualIndex < 0 || actualIndex >= manifest.versions.length) {
    throw new Error(`Version index ${index} out of range (0-${manifest.versions.length - 1})`)
  }
  
  const versionInfo = manifest.versions[actualIndex]
  const versionPath = path.join(versionsDir, versionInfo.filename)
  const content = JSON.parse(await fs.readFile(versionPath, 'utf-8'))
  
  return { content, versionInfo, index: actualIndex }
}

/**
 * Restore a previous version (copies it to current, creates new version first)
 * 
 * @param {string} filePath - Path to the current file
 * @param {number} index - Version index to restore
 * @returns {object} - The restored version info
 */
export async function restoreVersion(filePath, index) {
  // First, save current state as a version
  await createVersion(filePath, `Before restore to version ${index}`, 'restore')
  
  // Get the version to restore
  const { content, versionInfo } = await getVersion(filePath, index)
  
  // Write it as current
  await fs.writeFile(filePath, JSON.stringify(content, null, 2))
  
  // Create a new version noting the restore
  await createVersion(filePath, `Restored from: ${versionInfo.message}`, 'restore')
  
  console.log(`🔄 Restored version from ${versionInfo.timestamp}`)
  return versionInfo
}

/**
 * Compare two versions (returns both contents for UI to diff)
 * 
 * @param {string} filePath - Path to the file
 * @param {number} indexA - First version index
 * @param {number} indexB - Second version index (or 'current' for live file)
 * @returns {object} - { versionA, versionB, contentA, contentB }
 */
export async function compareVersions(filePath, indexA, indexB = 'current') {
  const versionA = await getVersion(filePath, indexA)
  
  let versionB, contentB
  if (indexB === 'current') {
    contentB = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    versionB = { 
      versionInfo: { timestamp: 'current', message: 'Current working version' },
      index: 'current'
    }
  } else {
    versionB = await getVersion(filePath, indexB)
    contentB = versionB.content
  }
  
  return {
    versionA: versionA.versionInfo,
    versionB: versionB.versionInfo,
    contentA: versionA.content,
    contentB: contentB
  }
}

/**
 * Check if a file has any versions
 */
export async function hasVersions(filePath) {
  const versionsDir = getVersionsDir(filePath)
  try {
    const manifest = await loadManifest(versionsDir)
    return manifest.versions.length > 0
  } catch {
    return false
  }
}

/**
 * Set max versions for a file
 */
export async function setMaxVersions(filePath, maxVersions) {
  const versionsDir = getVersionsDir(filePath)
  await fs.mkdir(versionsDir, { recursive: true })
  const manifest = await loadManifest(versionsDir)
  manifest.maxVersions = maxVersions
  await saveManifest(versionsDir, manifest)
}

export default {
  createVersion,
  listVersions,
  getVersion,
  restoreVersion,
  compareVersions,
  hasVersions,
  setMaxVersions,
  getVersionsDir
}
