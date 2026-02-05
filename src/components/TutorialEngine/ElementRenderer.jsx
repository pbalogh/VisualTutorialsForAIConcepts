import React from 'react'
import { 
  TutorialStateProvider, 
  StateValue, 
  StateComputed, 
  Slider, 
  Toggle,
  NumberInput,
  StateConditional 
} from './TutorialStateContext'
import { Annotation, FootnoteAnnotation, AnnotatableContent } from '../AnnotationSystem'

/**
 * Registry of components that can be rendered from JSON
 * Keys are the "type" values in the JSON, values are React components
 */
const componentMap = {
  // State bindings
  StateValue,
  StateComputed,
  Slider,
  Toggle,
  NumberInput,
  StateConditional,
  
  // Annotations
  Annotation,
  FootnoteAnnotation,
  
  // Layout helpers
  Fragment: React.Fragment,
  
  Box: ({ children, className = '' }) => (
    <div className={className}>{children}</div>
  ),
  
  // Interactive card - highlighted for interactions
  InteractiveCard: ({ children, className = '' }) => (
    <div className={`
      relative
      bg-gradient-to-br from-slate-50 to-slate-100/80
      border border-slate-200/80
      rounded-2xl p-6 my-8
      shadow-lg shadow-indigo-500/5
      ring-1 ring-slate-200/50
      ${className}
    `}>
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/[0.02] to-violet-500/[0.02]" />
      <div className="relative">
        {children}
      </div>
    </div>
  ),
  
  // Basic card
  Card: ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 my-6 ${className}`}>
      {children}
    </div>
  ),
  
  // Premium callouts with floating icon badges (Stripe-style)
  Callout: ({ type = 'info', children }) => {
    const styles = {
      info: {
        container: 'bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200/50',
        icon: 'bg-sky-500 shadow-sky-500/30',
        text: 'text-sky-900',
        iconEmoji: '💡',
      },
      warning: {
        container: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50',
        icon: 'bg-amber-500 shadow-amber-500/30',
        text: 'text-amber-900',
        iconEmoji: '⚠️',
      },
      success: {
        container: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50',
        icon: 'bg-emerald-500 shadow-emerald-500/30',
        text: 'text-emerald-900',
        iconEmoji: '✅',
      },
      tip: {
        container: 'bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200/50',
        icon: 'bg-violet-500 shadow-violet-500/30',
        text: 'text-violet-900',
        iconEmoji: '🎯',
      },
    }
    const s = styles[type]
    
    return (
      <div className={`relative my-8 p-5 pt-6 rounded-xl border ${s.container}`}>
        {/* Floating icon badge */}
        <div className={`absolute -top-3 -left-1 w-8 h-8 rounded-lg shadow-lg flex items-center justify-center ${s.icon}`}>
          <span className="text-sm">{s.iconEmoji}</span>
        </div>
        <div className={`pl-2 text-sm leading-relaxed ${s.text}`}>
          {children}
        </div>
      </div>
    )
  },
  
  // Premium code block with language label and copy button
  Code: ({ children, language = 'javascript', filename }) => {
    const [copied, setCopied] = React.useState(false)
    
    const handleCopy = () => {
      navigator.clipboard.writeText(typeof children === 'string' ? children : '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    
    return (
      <div className="relative my-8 group">
        {/* Language badge - floating */}
        <div className="absolute -top-3 left-4 px-3 py-1 bg-gray-800 rounded-md text-xs font-mono text-gray-400 border border-gray-700 z-10">
          {filename || language}
        </div>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-400 
            opacity-0 group-hover:opacity-100 transition-opacity 
            hover:bg-gray-700 hover:text-white z-10"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        
        {/* Code container */}
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
          <pre className="p-6 pt-8 overflow-x-auto">
            <code className="text-sm font-mono text-gray-300 leading-relaxed">
              {children}
            </code>
          </pre>
        </div>
      </div>
    )
  },
  
  // Math/equation with subtle highlight
  Math: ({ children, block = false }) => (
    <span className={`font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded ${
      block ? 'block text-center my-6 text-lg py-4' : ''
    }`}>
      {children}
    </span>
  ),
  
  // Section with numbered badges
  Section: ({ title, number, children, className = '' }) => (
    <section className={`mt-16 first:mt-0 ${className}`}>
      {title && (
        <h2 className="flex items-center gap-4 text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
          {number && (
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 text-sm font-bold">
              {number}
            </span>
          )}
          {title}
        </h2>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  ),
  
  // Pull quote for key insights
  Blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 pl-6 my-8 text-xl text-gray-600 italic leading-relaxed">
      {children}
    </blockquote>
  ),
  
  // Collapsible deep dive section with spring animation feel
  DeepDive: ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)
    return (
      <div className="my-8 rounded-xl overflow-hidden border border-violet-200 shadow-sm bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 text-left font-medium text-violet-900 
            flex justify-between items-center hover:from-violet-100 hover:to-purple-100 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-violet-500 text-white text-xs flex items-center justify-center shadow shadow-violet-500/30">
              🌿
            </span>
            {title}
          </span>
          <span className={`transform transition-transform duration-300 text-violet-400 ${
            isOpen ? 'rotate-180' : ''
          }`}>
            ▼
          </span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-5 border-t border-violet-100">
            <div className="text-gray-700 leading-7 space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  },
  
  // Paragraph with optimal line height
  p: ({ children, className = '' }) => (
    <p className={`text-gray-600 leading-7 ${className}`}>
      {children}
    </p>
  ),
  
  // Strong/bold with slightly darker color
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  
  // Emphasis/italic
  em: ({ children }) => (
    <em className="text-gray-600 italic">{children}</em>
  ),
  
  // Inline code
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">
      {children}
    </code>
  ),
  
  // Links with underline animation
  a: ({ href, children }) => (
    <a 
      href={href}
      className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-500 transition-colors"
    >
      {children}
    </a>
  ),
  
  // Lists with proper spacing
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 text-gray-600 my-4 pl-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),
  
  // HTML elements pass through
}

/**
 * Recursively renders a JSON element tree into React components
 */
export function renderElement(node, key = undefined) {
  // Text or number node
  if (typeof node === 'string' || typeof node === 'number') {
    return node
  }
  
  // Null/undefined
  if (!node) return null
  
  // Array of nodes
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{renderElement(child, i)}</React.Fragment>
    ))
  }
  
  // Element node: { type, props, children }
  const { type, props = {}, children } = node
  
  if (!type) {
    console.warn('Element missing type:', node)
    return null
  }
  
  // Resolve component: check registry first, then use as HTML tag
  const Component = componentMap[type] || type
  
  // Handle children: could be in node.children or node.props.children
  const nodeChildren = children !== undefined ? children : props.children
  const renderedChildren = nodeChildren !== undefined ? renderElement(nodeChildren) : undefined
  
  // Remove children from props since we pass them separately
  const { children: _, ...restProps } = props
  
  return React.createElement(
    Component, 
    { ...restProps, key: key ?? props.key }, 
    renderedChildren
  )
}

/**
 * Main component that renders a tutorial from JSON data
 */
export function TutorialContent({ data, onAnnotationRequest }) {
  const content = (
    <TutorialStateProvider initialState={data.state || {}}>
      <div className="tutorial-content">
        {renderElement(data.content)}
      </div>
    </TutorialStateProvider>
  )
  
  // Wrap with annotation support if handler provided
  if (onAnnotationRequest) {
    return (
      <AnnotatableContent 
        tutorialId={data.id} 
        onAnnotationRequest={onAnnotationRequest}
      >
        {content}
      </AnnotatableContent>
    )
  }
  
  return content
}

/**
 * Register additional components at runtime
 */
export function registerComponent(name, component) {
  componentMap[name] = component
}

/**
 * Get list of registered component names (for documentation)
 */
export function getRegisteredComponents() {
  return Object.keys(componentMap)
}

export default {
  renderElement,
  TutorialContent,
  registerComponent,
  getRegisteredComponents,
}
