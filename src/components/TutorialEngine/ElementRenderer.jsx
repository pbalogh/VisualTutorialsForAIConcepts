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
      bg-gradient-to-br from-slate-50 to-slate-100/80
      border border-slate-200
      rounded-xl p-6 my-6
      shadow-lg shadow-blue-500/5
      ring-1 ring-slate-200/50
      ${className}
    `}>
      {children}
    </div>
  ),
  
  // Basic card
  Card: ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 my-6 ${className}`}>
      {children}
    </div>
  ),
  
  // Callouts with left border style
  Callout: ({ type = 'info', children }) => {
    const styles = {
      info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-900',
      warning: 'bg-amber-50 border-l-4 border-amber-500 text-amber-900',
      success: 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900',
      tip: 'bg-violet-50 border-l-4 border-violet-500 text-violet-900',
    }
    const icons = { info: '💡', warning: '⚠️', success: '✅', tip: '🎯' }
    return (
      <div className={`p-4 my-6 rounded-r-lg ${styles[type]}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{icons[type]}</span>
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    )
  },
  
  // Code block with copy button and language label
  Code: ({ children, language = 'javascript', filename }) => {
    const [copied, setCopied] = React.useState(false)
    
    const handleCopy = () => {
      navigator.clipboard.writeText(typeof children === 'string' ? children : '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    
    return (
      <div className="relative group my-6">
        {/* Language/filename label */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl border-b border-slate-700">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            {filename || language}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-100 p-5 rounded-b-xl overflow-x-auto text-sm font-mono leading-relaxed
          shadow-inner ring-1 ring-white/5">
          <code>{children}</code>
        </pre>
      </div>
    )
  },
  
  // Math/equation placeholder
  Math: ({ children, block = false }) => (
    <span className={`font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded ${
      block ? 'block text-center my-6 text-lg py-4' : ''
    }`}>
      {children}
    </span>
  ),
  
  // Section with optional title - adds good spacing
  Section: ({ title, children, className = '' }) => (
    <section className={`mt-16 first:mt-0 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight 
          border-b border-slate-200 pb-4">
          {title}
        </h2>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  ),
  
  // Collapsible deep dive section
  DeepDive: ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)
    return (
      <div className="my-6 border border-violet-200 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-5 py-4 bg-violet-50 text-left font-medium text-violet-900 
            flex justify-between items-center hover:bg-violet-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="text-violet-500">🌿</span>
            {title}
          </span>
          <span className={`transform transition-transform duration-200 text-violet-400 ${
            isOpen ? 'rotate-180' : ''
          }`}>
            ▼
          </span>
        </button>
        {isOpen && (
          <div className="p-5 bg-white border-t border-violet-100">
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
              {children}
            </div>
          </div>
        )}
      </div>
    )
  },
  
  // Paragraph with good line height
  p: ({ children, className = '' }) => (
    <p className={`text-slate-700 leading-relaxed ${className}`}>
      {children}
    </p>
  ),
  
  // Strong/bold
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  
  // Emphasis/italic
  em: ({ children }) => (
    <em className="text-slate-600 italic">{children}</em>
  ),
  
  // Inline code
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">
      {children}
    </code>
  ),
  
  // Links
  a: ({ href, children }) => (
    <a 
      href={href}
      className="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-500 transition-colors"
    >
      {children}
    </a>
  ),
  
  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 text-slate-700 my-4">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  
  // HTML elements are passed through automatically
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
