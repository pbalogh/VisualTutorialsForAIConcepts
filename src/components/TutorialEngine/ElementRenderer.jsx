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
  Box: ({ children, className = '' }) => <div className={className}>{children}</div>,
  Card: ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 my-4 ${className}`}>
      {children}
    </div>
  ),
  Callout: ({ type = 'info', children }) => {
    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      tip: 'bg-purple-50 border-purple-200 text-purple-800',
    }
    const icons = { info: '💡', warning: '⚠️', success: '✅', tip: '🎯' }
    return (
      <div className={`p-4 my-4 rounded-lg border-l-4 ${styles[type]}`}>
        <span className="mr-2">{icons[type]}</span>
        {children}
      </div>
    )
  },
  
  // Code block
  Code: ({ children, language = 'javascript' }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
      <code>{children}</code>
    </pre>
  ),
  
  // Math/equation placeholder (could integrate KaTeX later)
  Math: ({ children, block = false }) => (
    <span className={`font-mono text-gray-800 ${block ? 'block text-center my-4 text-lg' : ''}`}>
      {children}
    </span>
  ),
  
  // Section with optional title
  Section: ({ title, children, className = '' }) => (
    <section className={`my-8 ${className}`}>
      {title && <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>}
      {children}
    </section>
  ),
  
  // Collapsible deep dive section
  DeepDive: ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)
    return (
      <div className="my-4 border border-green-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-green-50 text-left font-medium text-green-800 flex justify-between items-center hover:bg-green-100"
        >
          <span>🌿 {title}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="p-4 bg-white">
            {children}
          </div>
        )}
      </div>
    )
  },
  
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
      <div className="tutorial-content prose prose-lg max-w-none">
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
