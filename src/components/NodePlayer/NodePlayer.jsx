/**
 * NodePlayer - Animated presentation of tutorial node content
 * 
 * Takes a node's content and renders an animated, narrated presentation.
 * Think: Schoolhouse Rock meets React.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Simple text-to-speech wrapper
function useSpeech() {
  const utteranceRef = useRef(null)
  
  const speak = useCallback((text, onEnd) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.onend = onEnd
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } else {
      // Fallback: just wait a bit
      setTimeout(onEnd, text.length * 50)
    }
  }, [])
  
  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])
  
  return { speak, stop }
}

// Slide types
const SlideRenderers = {
  title: ({ content, isActive }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isActive ? 1 : 0.3, scale: isActive ? 1 : 0.9 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.h1 
        className="text-4xl font-bold text-white text-center"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {content.title}
      </motion.h1>
      {content.subtitle && (
        <motion.p 
          className="text-xl text-white/70 mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {content.subtitle}
        </motion.p>
      )}
    </motion.div>
  ),
  
  bullets: ({ content, isActive, progress }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      className="flex flex-col justify-center h-full px-12"
    >
      <h2 className="text-2xl font-semibold text-white mb-8">{content.heading}</h2>
      <ul className="space-y-4">
        {content.points?.map((point, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: progress > (i / content.points.length) ? 1 : 0.2,
              x: progress > (i / content.points.length) ? 0 : -20
            }}
            transition={{ duration: 0.3 }}
            className="text-xl text-white/90 flex items-start gap-3"
          >
            <span className="text-emerald-400 mt-1">●</span>
            {point}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  ),
  
  concept: ({ content, isActive }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      className="flex flex-col items-center justify-center h-full px-12"
    >
      <motion.div
        className="text-6xl mb-6"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {content.emoji || '💡'}
      </motion.div>
      <h2 className="text-3xl font-bold text-white text-center mb-4">
        {content.concept}
      </h2>
      <p className="text-xl text-white/70 text-center max-w-2xl">
        {content.explanation}
      </p>
    </motion.div>
  ),
  
  analogy: ({ content, isActive }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      className="flex items-center justify-center h-full px-12 gap-8"
    >
      <motion.div 
        className="flex-1 text-center"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
      >
        <div className="text-5xl mb-4">{content.leftEmoji || '🧠'}</div>
        <div className="text-xl text-white font-medium">{content.left}</div>
      </motion.div>
      
      <motion.div
        className="text-4xl text-emerald-400"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ≈
      </motion.div>
      
      <motion.div 
        className="flex-1 text-center"
        initial={{ x: 50 }}
        animate={{ x: 0 }}
      >
        <div className="text-5xl mb-4">{content.rightEmoji || '🎵'}</div>
        <div className="text-xl text-white font-medium">{content.right}</div>
      </motion.div>
    </motion.div>
  ),
  
  summary: ({ content, isActive }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isActive ? 1 : 0.3, scale: isActive ? 1 : 0.9 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-5xl mb-6">🎯</div>
      <h2 className="text-2xl font-bold text-white mb-6">Key Takeaway</h2>
      <p className="text-2xl text-emerald-400 text-center max-w-2xl font-medium">
        {content.takeaway}
      </p>
    </motion.div>
  )
}

export default function NodePlayer({ 
  script, // Array of { type, content, narration, duration }
  onClose,
  autoPlay = true 
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [progress, setProgress] = useState(0)
  const { speak, stop } = useSpeech()
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  
  const slide = script?.[currentSlide]
  
  // Handle slide progression
  useEffect(() => {
    if (!isPlaying || !slide) return
    
    // Start narration
    if (slide.narration) {
      speak(slide.narration, () => {
        // Narration done - could auto-advance here
      })
    }
    
    // Progress animation
    startTimeRef.current = Date.now()
    const duration = slide.duration || 5000
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min(elapsed / duration, 1)
      setProgress(newProgress)
      
      if (newProgress < 1) {
        timerRef.current = requestAnimationFrame(updateProgress)
      } else {
        // Auto-advance to next slide
        if (currentSlide < script.length - 1) {
          setCurrentSlide(prev => prev + 1)
          setProgress(0)
        } else {
          setIsPlaying(false)
        }
      }
    }
    
    timerRef.current = requestAnimationFrame(updateProgress)
    
    return () => {
      cancelAnimationFrame(timerRef.current)
      stop()
    }
  }, [currentSlide, isPlaying, slide, speak, stop, script?.length])
  
  if (!script || script.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-white">No presentation script available</p>
      </div>
    )
  }
  
  const SlideRenderer = SlideRenderers[slide?.type] || SlideRenderers.concept
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Close button */}
      <button
        onClick={() => {
          stop()
          onClose?.()
        }}
        className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl z-10"
      >
        ✕
      </button>
      
      {/* Main content */}
      <div className="h-full flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <SlideRenderer 
              key={currentSlide}
              content={slide.content} 
              isActive={true}
              progress={progress}
            />
          </AnimatePresence>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <motion.div 
            className="h-full bg-emerald-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        {/* Controls */}
        <div className="p-4 flex items-center justify-center gap-4 bg-black/30">
          <button
            onClick={() => {
              stop()
              setCurrentSlide(Math.max(0, currentSlide - 1))
              setProgress(0)
            }}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-white/60 hover:text-white disabled:opacity-30"
          >
            ◀ Prev
          </button>
          
          <button
            onClick={() => {
              if (isPlaying) {
                stop()
                cancelAnimationFrame(timerRef.current)
              }
              setIsPlaying(!isPlaying)
            }}
            className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-500"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <button
            onClick={() => {
              stop()
              setCurrentSlide(Math.min(script.length - 1, currentSlide + 1))
              setProgress(0)
            }}
            disabled={currentSlide === script.length - 1}
            className="px-4 py-2 text-white/60 hover:text-white disabled:opacity-30"
          >
            Next ▶
          </button>
          
          {/* Slide counter */}
          <span className="text-white/40 ml-4">
            {currentSlide + 1} / {script.length}
          </span>
        </div>
      </div>
    </div>
  )
}

// Helper to generate script from AI
export async function generatePresentationScript(nodeContent, nodeTitle) {
  const response = await fetch('http://localhost:5190/generate-presentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeContent, nodeTitle })
  })
  
  if (!response.ok) throw new Error('Failed to generate presentation')
  
  const result = await response.json()
  return result.script
}
