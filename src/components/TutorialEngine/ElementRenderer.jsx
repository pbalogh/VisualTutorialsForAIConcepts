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

// Visualization components
import { VectorProjectionViz } from '../visualizations/VectorProjectionViz'

/**
 * Registry of components that can be rendered from JSON
 * Keys are the "type" values in the JSON, values are React components
 */
const componentMap = {
  // Visualization components
  VectorProjectionViz,
  
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
  
  // Annotation marker - links to a deep dive or explanation
  AnnotationMarker: ({ targetId, type, label }) => (
    <button
      onClick={() => {
        const target = document.getElementById(targetId)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          target.classList.add('ring-2', 'ring-violet-400', 'ring-offset-2')
          setTimeout(() => {
            target.classList.remove('ring-2', 'ring-violet-400', 'ring-offset-2')
          }, 2000)
        }
      }}
      className={`
        inline-flex items-center justify-center
        w-5 h-5 ml-1 rounded-full text-xs
        transition-all hover:scale-110
        ${type === 'branch' 
          ? 'bg-violet-100 text-violet-600 hover:bg-violet-200' 
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }
      `}
      title={type === 'branch' ? 'Go to Deep Dive' : 'Go to Explanation'}
    >
      {label}
    </button>
  ),
  
  // Footnote reference - superscript link to footnote (appears inline at source)
  FootnoteRef: ({ id, targetId, type }) => {
    const icons = { footnote: '📝', branch: '🌿', ask: '❓', explain: '💡' }
    return (
      <sup
        id={id}
        onClick={() => {
          const target = document.getElementById(targetId)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' })
            target.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2')
            setTimeout(() => target.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2'), 2000)
          }
        }}
        className="inline-flex items-center justify-center ml-0.5 px-1 py-0.5 
          text-xs rounded cursor-pointer select-none
          bg-indigo-100 text-indigo-600 hover:bg-indigo-200 
          transition-colors align-super"
        title="Jump to note"
      >
        {icons[type] || '📎'}
      </sup>
    )
  },
  
  // User footnote - personal marginalia augmented by AI
  Footnote: ({ id, sourceId, reference, userNote, children }) => (
    <div 
      id={id}
      className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50"
    >
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>📝</span>
          <span className="font-medium">Note on "{reference}..."</span>
        </div>
        {sourceId && (
          <button
            onClick={() => {
              const source = document.getElementById(sourceId)
              if (source) {
                source.scrollIntoView({ behavior: 'smooth', block: 'center' })
                source.classList.add('bg-yellow-200')
                setTimeout(() => source.classList.remove('bg-yellow-200'), 2000)
              }
            }}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            title="Jump back to source"
          >
            ↑ back
          </button>
        )}
      </div>
      <div className="p-4 text-slate-700 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  ),
  
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
        {/* Language badge - more visible */}
        <div className="absolute -top-3 left-4 px-3 py-1.5 bg-gradient-to-r from-gray-800 to-gray-700 
          rounded-lg text-xs font-mono text-gray-300 border border-gray-600 z-10 
          shadow-lg shadow-black/20">
          {filename || language}
        </div>
        
        {/* Copy button with "Copied!" confirmation */}
        <button
          onClick={handleCopy}
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200 z-10 flex items-center gap-1.5
            ${copied 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 opacity-100' 
              : 'bg-gray-800 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-700 hover:text-white border border-transparent'
            }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
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
  DeepDive: ({ title, children, defaultOpen = false, id }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)
    return (
      <div 
        id={id}
        className="my-8 rounded-xl overflow-hidden border border-violet-200 shadow-sm bg-white transition-all"
      >
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
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 text-gray-600 my-4 pl-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),
  
  // Definition list - great for term explanations
  DefinitionList: ({ items }) => (
    <dl className="my-6 space-y-4">
      {items?.map((item, i) => (
        <div key={i} className="border-l-2 border-indigo-200 pl-4">
          <dt className="font-semibold text-gray-900">{item.term}</dt>
          <dd className="text-gray-600 mt-1">{item.definition}</dd>
        </div>
      ))}
    </dl>
  ),
  
  // Comparison table - for before/after, pros/cons
  ComparisonTable: ({ headers, rows }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers?.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  
  // Step-by-step process
  Steps: ({ steps }) => (
    <div className="my-6 space-y-4">
      {steps?.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 
            flex items-center justify-center font-bold text-sm">
            {i + 1}
          </div>
          <div className="flex-1 pt-1">
            {typeof step === 'string' ? (
              <p className="text-gray-600">{step}</p>
            ) : (
              <>
                <p className="font-medium text-gray-900">{step.title}</p>
                {step.description && <p className="text-gray-600 mt-1">{step.description}</p>}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  ),
  
  // Key-value pairs (for showing formulas, properties)
  KeyValue: ({ label, value, highlight = false }) => (
    <div className={`flex items-center justify-between py-2 px-4 rounded-lg my-2 ${
      highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'
    }`}>
      <span className="text-gray-600">{label}</span>
      <span className={`font-mono font-semibold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  ),
  
  // Highlighted example box
  Example: ({ title, children }) => (
    <div className="my-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      <div className="px-5 py-3 bg-amber-100/50 border-b border-amber-200">
        <span className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <span>📝</span> {title || 'Example'}
        </span>
      </div>
      <div className="p-5 text-gray-700">
        {children}
      </div>
    </div>
  ),
  
  // Formula display (monospace, centered)
  Formula: ({ children, label }) => (
    <div className="my-6 text-center">
      {label && <div className="text-xs text-gray-500 mb-2">{label}</div>}
      <div className="inline-block px-6 py-4 bg-gray-50 rounded-xl border border-gray-200">
        <code className="text-lg font-mono text-gray-800">{children}</code>
      </div>
    </div>
  ),
  
  // Analogy box - for "think of it like..."
  Analogy: ({ children }) => (
    <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🎭</span>
        <div className="text-gray-700 italic leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  ),
  
  // Divider with optional label
  Divider: ({ label }) => (
    <div className="my-8 flex items-center gap-4">
      <div className="flex-1 h-px bg-gray-200" />
      {label && <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  ),
  
  // Badge/tag inline
  Badge: ({ children, color = 'gray' }) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      amber: 'bg-amber-100 text-amber-700',
      red: 'bg-red-100 text-red-700',
      purple: 'bg-purple-100 text-purple-700',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.gray}`}>
        {children}
      </span>
    )
  },
  
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
 * Simplified interface: accepts content and state separately
 */
export function TutorialEngine({ content, state = {} }) {
  return (
    <TutorialStateProvider initialState={state}>
      <div className="tutorial-content">
        {renderElement(content)}
      </div>
    </TutorialStateProvider>
  )
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
  TutorialEngine,
  registerComponent,
  getRegisteredComponents,
}
