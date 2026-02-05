import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Listing from './pages/Listing.jsx'
import TutorialWrapper from './pages/TutorialWrapper.jsx'
import './App.css'

function App() {
  return (
    <Router basename="/VisualTutorialsForAIConcepts">
      <Routes>
        <Route path="/" element={<Listing />} />
        <Route path="/tutorial/:tutorialId" element={<TutorialWrapper />} />
      </Routes>
    </Router>
  )
}

export default App
