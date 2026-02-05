import React, { createContext, useContext, useState, useCallback } from 'react'

const TutorialStateContext = createContext()

/**
 * Provider that holds tutorial state and makes it available to all child components
 */
export function TutorialStateProvider({ initialState = {}, children }) {
  const [state, setState] = useState(initialState)
  
  const updateState = useCallback((key, value) => {
    console.log('📊 State update:', key, '=', value)
    setState(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const getState = useCallback((key) => state[key], [state])
  
  return (
    <TutorialStateContext.Provider value={{ state, updateState, getState }}>
      {children}
    </TutorialStateContext.Provider>
  )
}

export const useTutorialState = () => {
  const context = useContext(TutorialStateContext)
  if (!context) {
    throw new Error('useTutorialState must be used within a TutorialStateProvider')
  }
  return context
}

/**
 * StateValue - displays a bound state value with optional formatting
 */
export function StateValue({ bind, format, className = '' }) {
  const { state } = useTutorialState()
  const value = state[bind]
  
  let formatted = value
  if (format && value !== undefined) {
    if (format === '.0f') formatted = Math.round(value)
    else if (format === '.1f') formatted = value.toFixed(1)
    else if (format === '.2f') formatted = value.toFixed(2)
    else if (format === '.0%') formatted = `${(value * 100).toFixed(0)}%`
    else if (format === '.1%') formatted = `${(value * 100).toFixed(1)}%`
    else if (format === '+.2f') formatted = (value >= 0 ? '+' : '') + value.toFixed(2)
  }
  
  return (
    <span className={`font-mono text-blue-600 bg-blue-50 px-1 rounded ${className}`}>
      {formatted}
    </span>
  )
}

/**
 * StateComputed - displays a computed expression based on state
 * Uses a safe eval with state variables in scope
 */
export function StateComputed({ compute, className = '' }) {
  const { state } = useTutorialState()
  
  try {
    // Create function with state keys as parameters
    const fn = new Function(...Object.keys(state), `return ${compute}`)
    const result = fn(...Object.values(state))
    return <span className={`italic text-purple-600 ${className}`}>{result}</span>
  } catch (e) {
    console.error('StateComputed error:', e)
    return <span className="text-red-500">[Error: {e.message}]</span>
  }
}

/**
 * Slider - modifies a bound state value
 */
export function Slider({ bind, min = 0, max = 100, step = 1, label, showValue = true }) {
  const { state, updateState } = useTutorialState()
  const value = state[bind] ?? min
  
  return (
    <div className="my-4 p-4 bg-gray-50 rounded-lg">
      <label className="flex justify-between items-center text-sm font-medium text-gray-700 mb-2">
        <span>{label}</span>
        {showValue && <span className="font-mono text-blue-600">{value}</span>}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateState(bind, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  )
}

/**
 * Toggle - boolean state control
 */
export function Toggle({ bind, label }) {
  const { state, updateState } = useTutorialState()
  const value = state[bind] ?? false
  
  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔀 Toggle:', bind, !value)
    updateState(bind, !value)
  }
  
  return (
    <div 
      className="flex items-center gap-3 my-2 cursor-pointer select-none"
      onClick={handleToggle}
    >
      <div 
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <div 
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  )
}

/**
 * NumberInput - numeric state input
 */
export function NumberInput({ bind, label, min, max, step = 1 }) {
  const { state, updateState } = useTutorialState()
  const value = state[bind] ?? 0
  
  return (
    <div className="my-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateState(bind, parseFloat(e.target.value))}
        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

/**
 * StateConditional - conditionally renders children based on state
 */
export function StateConditional({ when, children, otherwise = null }) {
  const { state } = useTutorialState()
  
  try {
    const fn = new Function(...Object.keys(state), `return ${when}`)
    const result = fn(...Object.values(state))
    return result ? children : otherwise
  } catch (e) {
    console.error('StateConditional error:', e)
    return null
  }
}

export default {
  TutorialStateProvider,
  useTutorialState,
  StateValue,
  StateComputed,
  Slider,
  Toggle,
  NumberInput,
  StateConditional,
}
