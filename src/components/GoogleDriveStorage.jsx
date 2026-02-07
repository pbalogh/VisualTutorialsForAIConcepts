/**
 * GoogleDriveStorage - Use Google Drive as a data store for static web apps
 * 
 * This allows a static React app (hosted on GitHub Pages, etc.) to persist
 * user data to THEIR OWN Google Drive, using their OAuth credentials.
 * 
 * Setup required:
 * 1. Create a Google Cloud project: https://console.cloud.google.com
 * 2. Enable the Google Drive API
 * 3. Create OAuth 2.0 credentials (Web application)
 * 4. Add your domains to authorized JavaScript origins
 * 5. Replace CLIENT_ID below with your client ID
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Replace with your Google Cloud OAuth client ID
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'
const API_KEY = 'YOUR_API_KEY' // Optional, for public data only
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

// Folder name in user's Drive where we store data
const APP_FOLDER_NAME = 'TutorialAnnotations'

// Context for Google Drive storage
const GoogleDriveContext = createContext(null)

/**
 * Load the Google API client library
 */
function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve(window.gapi)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => resolve(window.gapi)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

/**
 * Load the Google Identity Services library
 */
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve(window.google)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => resolve(window.google)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

/**
 * Provider component that manages Google Drive authentication and storage
 */
export function GoogleDriveProvider({ children, clientId = CLIENT_ID }) {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [tokenClient, setTokenClient] = useState(null)
  const [appFolderId, setAppFolderId] = useState(null)

  // Initialize GAPI and GIS
  useEffect(() => {
    let mounted = true
    
    async function init() {
      try {
        // Load both scripts
        const [gapi, google] = await Promise.all([
          loadGapiScript(),
          loadGisScript()
        ])
        
        // Initialize GAPI client
        await new Promise((resolve) => gapi.load('client', resolve))
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        })
        
        // Initialize token client
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              setError(response.error)
              return
            }
            setIsSignedIn(true)
            // Get user info
            fetchUserInfo()
          },
        })
        
        if (mounted) {
          setTokenClient(client)
          setIsLoading(false)
          
          // Check if we have a valid token already
          const token = gapi.client.getToken()
          if (token) {
            setIsSignedIn(true)
            fetchUserInfo()
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }
    
    init()
    return () => { mounted = false }
  }, [clientId])

  // Fetch user info after sign in
  const fetchUserInfo = async () => {
    try {
      const response = await window.gapi.client.request({
        path: 'https://www.googleapis.com/oauth2/v2/userinfo'
      })
      setUser(response.result)
      
      // Ensure app folder exists
      const folderId = await ensureAppFolder()
      setAppFolderId(folderId)
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  // Sign in
  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken()
    }
  }, [tokenClient])

  // Sign out
  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token)
      window.gapi.client.setToken(null)
    }
    setIsSignedIn(false)
    setUser(null)
    setAppFolderId(null)
  }, [])

  // Ensure app folder exists in Drive
  const ensureAppFolder = async () => {
    const gapi = window.gapi
    
    // Check if folder exists
    const response = await gapi.client.drive.files.list({
      q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)'
    })
    
    if (response.result.files.length > 0) {
      return response.result.files[0].id
    }
    
    // Create folder
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    })
    
    return createResponse.result.id
  }

  // Save JSON data to a file in the app folder
  const saveFile = useCallback(async (filename, data) => {
    if (!appFolderId) throw new Error('Not signed in')
    
    const gapi = window.gapi
    const content = JSON.stringify(data, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    
    // Check if file exists
    const listResponse = await gapi.client.drive.files.list({
      q: `name='${filename}' and '${appFolderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)'
    })
    
    if (listResponse.result.files.length > 0) {
      // Update existing file
      const fileId = listResponse.result.files[0].id
      
      // Use multipart upload for update
      const metadata = { name: filename }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', blob)
      
      const token = gapi.client.getToken().access_token
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        }
      )
      
      return response.json()
    } else {
      // Create new file
      const metadata = {
        name: filename,
        parents: [appFolderId]
      }
      
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', blob)
      
      const token = gapi.client.getToken().access_token
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        }
      )
      
      return response.json()
    }
  }, [appFolderId])

  // Load JSON data from a file
  const loadFile = useCallback(async (filename) => {
    if (!appFolderId) throw new Error('Not signed in')
    
    const gapi = window.gapi
    
    // Find file
    const listResponse = await gapi.client.drive.files.list({
      q: `name='${filename}' and '${appFolderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)'
    })
    
    if (listResponse.result.files.length === 0) {
      return null // File doesn't exist
    }
    
    const fileId = listResponse.result.files[0].id
    
    // Get file content
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    })
    
    return response.result
  }, [appFolderId])

  // List all files in app folder
  const listFiles = useCallback(async () => {
    if (!appFolderId) throw new Error('Not signed in')
    
    const gapi = window.gapi
    
    const response = await gapi.client.drive.files.list({
      q: `'${appFolderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, modifiedTime, size)'
    })
    
    return response.result.files
  }, [appFolderId])

  // Delete a file
  const deleteFile = useCallback(async (filename) => {
    if (!appFolderId) throw new Error('Not signed in')
    
    const gapi = window.gapi
    
    // Find file
    const listResponse = await gapi.client.drive.files.list({
      q: `name='${filename}' and '${appFolderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id)'
    })
    
    if (listResponse.result.files.length === 0) {
      return false
    }
    
    const fileId = listResponse.result.files[0].id
    await gapi.client.drive.files.delete({ fileId })
    
    return true
  }, [appFolderId])

  const value = {
    isSignedIn,
    isLoading,
    user,
    error,
    signIn,
    signOut,
    saveFile,
    loadFile,
    listFiles,
    deleteFile,
  }

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  )
}

/**
 * Hook to use Google Drive storage
 */
export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext)
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider')
  }
  return context
}

/**
 * Sign In Button component
 */
export function GoogleSignInButton({ className = '' }) {
  const { isSignedIn, isLoading, user, signIn, signOut } = useGoogleDrive()
  
  if (isLoading) {
    return (
      <button disabled className={`opacity-50 ${className}`}>
        Loading...
      </button>
    )
  }
  
  if (isSignedIn) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {user?.picture && (
          <img 
            src={user.picture} 
            alt={user.name} 
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button
          onClick={signOut}
          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 
            hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }
  
  return (
    <button
      onClick={signIn}
      className={`
        flex items-center gap-2 px-4 py-2 
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 hover:border-gray-400
        transition-colors shadow-sm
        ${className}
      `}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-gray-700 font-medium">Sign in with Google</span>
    </button>
  )
}

/**
 * Example: Annotation Storage Hook
 * 
 * Usage in a tutorial component:
 * 
 * const { annotations, saveAnnotation, isLoading } = useAnnotationStorage('rotate-paper')
 */
export function useAnnotationStorage(tutorialId) {
  const { isSignedIn, saveFile, loadFile } = useGoogleDrive()
  const [annotations, setAnnotations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  const filename = `${tutorialId}-annotations.json`
  
  // Load annotations on mount
  useEffect(() => {
    if (!isSignedIn) return
    
    setIsLoading(true)
    loadFile(filename)
      .then(data => {
        if (data?.annotations) {
          setAnnotations(data.annotations)
          setLastSaved(data.lastSaved)
        }
      })
      .catch(err => console.error('Failed to load annotations:', err))
      .finally(() => setIsLoading(false))
  }, [isSignedIn, filename, loadFile])
  
  // Save annotation
  const saveAnnotation = useCallback(async (annotation) => {
    const newAnnotations = [...annotations, { ...annotation, id: Date.now() }]
    setAnnotations(newAnnotations)
    
    const data = {
      tutorialId,
      annotations: newAnnotations,
      lastSaved: new Date().toISOString()
    }
    
    try {
      await saveFile(filename, data)
      setLastSaved(data.lastSaved)
    } catch (err) {
      console.error('Failed to save annotation:', err)
      throw err
    }
  }, [annotations, tutorialId, filename, saveFile])
  
  // Delete annotation
  const deleteAnnotation = useCallback(async (annotationId) => {
    const newAnnotations = annotations.filter(a => a.id !== annotationId)
    setAnnotations(newAnnotations)
    
    const data = {
      tutorialId,
      annotations: newAnnotations,
      lastSaved: new Date().toISOString()
    }
    
    await saveFile(filename, data)
    setLastSaved(data.lastSaved)
  }, [annotations, tutorialId, filename, saveFile])
  
  return {
    annotations,
    saveAnnotation,
    deleteAnnotation,
    isLoading,
    lastSaved,
    isSignedIn
  }
}

export default GoogleDriveProvider
