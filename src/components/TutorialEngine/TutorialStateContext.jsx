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
    <span className={`font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded transition-all ${className}`}>
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
    return <span className={`italic text-violet-600 ${className}`}>{result}</span>
  } catch (e) {
    console.error('StateComputed error:', e)
    return <span className="text-red-500">[Error: {e.message}]</span>
  }
}

/**
 * Premium Slider - tactile feel with gradient fill
 */
export function Slider({ bind, min = 0, max = 100, step = 1, label, showValue = true }) {
  const { state, updateState } = useTutorialState()
  const value = state[bind] ?? min
  
  // Calculate fill percentage
  const fillPercent = ((value - min) / (max - min)) * 100
  
  return (
    <div className="my-5">
      <label className="flex justify-between items-center text-sm font-medium text-gray-700 mb-3">
        <span>{label}</span>
        {showValue && (
          <span className="font-mono text-indigo-600 text-lg tabular-nums bg-indigo-50 px-2 py-0.5 rounded">
            {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
          </span>
        )}
      </label>
      
      <div className="relative h-2 w-full">
        {/* Background track */}
        <div className="absolute inset-0 bg-gray-200 rounded-full" />
        
        {/* Filled track with gradient */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-75"
          style={{ width: `${fillPercent}%` }}
        />
        
        {/* Actual input - styled thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => updateState(bind, parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-indigo-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-indigo-500/30
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-indigo-500
            [&::-moz-range-thumb]:shadow-lg
          "
        />
      </div>
    </div>
  )
}

/**
 * Premium Toggle - smooth with subtle animations
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
      className="flex items-center gap-3 my-3 cursor-pointer select-none group"
      onClick={handleToggle}
    >
      <div 
        className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
          value 
            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' 
            : 'bg-gray-300'
        }`}
      >
        <div 
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </div>
  )
}

/**
 * NumberInput - numeric state input with subtle styling
 */
export function NumberInput({ bind, label, min, max, step = 1 }) {
  const { state, updateState } = useTutorialState()
  const value = state[bind] ?? 0
  
  return (
    <div className="my-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateState(bind, parseFloat(e.target.value))}
        className="w-32 px-3 py-2 border border-gray-300 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          font-mono text-gray-700 transition-shadow"
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
