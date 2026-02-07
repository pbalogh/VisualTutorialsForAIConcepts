import React, { useState } from 'react'
import { 
  GoogleDriveProvider, 
  GoogleSignInButton, 
  useGoogleDrive,
  useAnnotationStorage 
} from '../components/GoogleDriveStorage'

/**
 * Demo page showing Google Drive as storage for a static web app
 */
function DemoContent() {
  const { isSignedIn, user, listFiles } = useGoogleDrive()
  const [files, setFiles] = useState([])
  const [showFiles, setShowFiles] = useState(false)
  
  // Demo annotation storage for a tutorial
  const { 
    annotations, 
    saveAnnotation, 
    deleteAnnotation,
    isLoading,
    lastSaved 
  } = useAnnotationStorage('demo-tutorial')
  
  const [noteText, setNoteText] = useState('')
  
  const handleAddNote = async () => {
    if (!noteText.trim()) return
    
    await saveAnnotation({
      type: 'note',
      text: noteText,
      createdAt: new Date().toISOString()
    })
    
    setNoteText('')
  }
  
  const handleListFiles = async () => {
    const result = await listFiles()
    setFiles(result)
    setShowFiles(true)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Drive Storage Demo
        </h1>
        <p className="text-gray-600 mb-8">
          This demonstrates using Google Drive as a data store for a static web app.
          Your data is saved to YOUR Google Drive — no server required!
        </p>
        
        {/* Auth Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Authentication
          </h2>
          <GoogleSignInButton />
          
          {isSignedIn && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-800 text-sm">
              ✅ Signed in as {user?.name} ({user?.email})
            </div>
          )}
        </div>
        
        {/* Annotation Demo */}
        {isSignedIn && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              2. Save Annotations
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg
                  hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
            
            {isLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : (
              <>
                {annotations.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No annotations yet. Add one above!
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {annotations.map((ann) => (
                      <li 
                        key={ann.id}
                        className="flex items-center justify-between p-3 
                          bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">{ann.text}</span>
                        <button
                          onClick={() => deleteAnnotation(ann.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                
                {lastSaved && (
                  <p className="text-xs text-gray-400 mt-3">
                    Last saved: {new Date(lastSaved).toLocaleString()}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        
        {/* File List */}
        {isSignedIn && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              3. Files in Your Drive
            </h2>
            
            <button
              onClick={handleListFiles}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                hover:bg-gray-200 transition-colors mb-4"
            >
              List Files in TutorialAnnotations/
            </button>
            
            {showFiles && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {files.length === 0 ? (
                  <p className="p-3 text-gray-500 text-sm">No files yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-600">Name</th>
                        <th className="text-left p-3 font-medium text-gray-600">Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id} className="border-t border-gray-100">
                          <td className="p-3 text-gray-800">{file.name}</td>
                          <td className="p-3 text-gray-500">
                            {new Date(file.modifiedTime).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* How It Works */}
        <div className="mt-8 p-6 bg-indigo-50 rounded-xl">
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">
            How It Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-indigo-800">
            <li>User signs in with Google OAuth</li>
            <li>App gets permission to create/read files it created</li>
            <li>Data saved as JSON in user's Drive (TutorialAnnotations/ folder)</li>
            <li>No server needed — works on static hosting!</li>
            <li>User owns their data and can access it anywhere</li>
          </ol>
        </div>
        
        {/* Setup Instructions */}
        <div className="mt-6 p-6 bg-amber-50 rounded-xl">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">
            ⚠️ Setup Required
          </h2>
          <p className="text-amber-800 text-sm mb-3">
            To use this in production, you need to:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700 text-sm">
            <li>Create a Google Cloud project</li>
            <li>Enable the Google Drive API</li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Add your domain to authorized origins</li>
            <li>Replace CLIENT_ID in GoogleDriveStorage.jsx</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function GoogleDriveDemo() {
  return (
    <GoogleDriveProvider>
      <DemoContent />
    </GoogleDriveProvider>
  )
}
