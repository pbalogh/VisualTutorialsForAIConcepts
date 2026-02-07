import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Listing from './pages/Listing.jsx'
import TutorialWrapper from './pages/TutorialWrapper.jsx'
import TreeWrapper from './pages/TreeWrapper.jsx'
import GoogleDriveDemo from './pages/GoogleDriveDemo.jsx'
import PasswordGate from './components/PasswordGate.jsx'
import './App.css'

// GitHub Pages needs basename, Netlify serves from root
const basename = window.location.hostname.includes('github.io') 
  ? '/VisualTutorialsForAIConcepts' 
  : '/'

function App() {
  return (
    <PasswordGate>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<Listing />} />
          <Route path="/tutorial/:tutorialId" element={<TutorialWrapper />} />
          <Route path="/tree/:tutorialId" element={<TreeWrapper />} />
          <Route path="/drive-demo" element={<GoogleDriveDemo />} />
        </Routes>
      </Router>
    </PasswordGate>
  )
}

export default App
