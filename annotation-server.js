/**
 * Tutorial Annotation Server
 * 
 * Receives annotation requests from the tutorial UI,
 * calls AI to generate contextual content,
 * modifies the JSON, commits to Git, and returns updated JSON.
 * 
 * AI provider configured in: ai-config.js
 * 
 * Run: node annotation-server.js
 * Endpoint: POST http://localhost:5190/annotate
 */

import http from 'http'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { callAI, getAIInfo } from './ai-config.js'
import { generatePresentationAudio } from './tts-polly.js'
import { generateFullSemanticTree, expandNode, computeTreeEmbeddings } from './semantic-tree.js'
import { ragQuery, multiHopQuery, compareRetrieval } from './hierarchical-rag.js'
import { createVersion, listVersions, getVersion, restoreVersion } from './src/utils/versioning.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 5190
const CONTENT_DIR = path.join(__dirname, 'src/content')
const TUTORIALS_REPO = __dirname

/**
 * Parse JSON body from request
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Send JSON response with CORS headers
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(data))
}

/**
 * Generate annotation content using AI
 */
async function generateAnnotation(action, selectedText, context, tutorialTitle, question = null) {
  const timestamp = new Date().toLocaleString()
  
  // System prompt that emphasizes contextual understanding
  const systemPrompt = `You are helping create educational content for an interactive tutorial called "${tutorialTitle || 'Tutorial'}".

Your job is to generate explanations that help users understand concepts IN THE CONTEXT of what they're learning, not generic definitions.

Key principles:
- The user selected "${selectedText}" — they likely know what these words mean individually
- What they want to know is: what does this mean HERE, in THIS tutorial's context?
- Be concise but insightful
- Reference other concepts from the tutorial when relevant
- Use concrete examples when helpful
Output format: Return ONLY the explanation text, no JSON, no formatting markers, no preamble.`

  try {
    if (action === 'explain') {
      const prompt = `The user is reading this passage:
"${context}"

They selected the phrase: "${selectedText}"

Write a brief (2-3 sentences) contextual explanation of what "${selectedText}" means in this specific context. Don't define the term generically — explain its role and significance in what they're learning.`

      console.log('🤖 Calling AI for explanation...')
      const explanation = await callAI(systemPrompt, prompt)
      
      // Create a collapsible Sidebar instead of inline Callout
      return {
        type: 'Sidebar',
        props: { 
          type: 'note',
          title: `About "${selectedText.length > 30 ? selectedText.slice(0, 30) + '...' : selectedText}"`
        },
        children: [
          {
            type: 'p',
            children: explanation.trim()
          },
          {
            type: 'p',
            props: { className: 'text-xs text-gray-400 mt-2' },
            children: `Added ${timestamp}`
          }
        ]
      }
    }
    
    if (action === 'branch') {
      const prompt = `The user is reading this passage:
"${context}"

They want to go deeper on: "${selectedText}"

Generate a rich, structured educational deep-dive. Return a JSON array of content elements.

Available component types:

BASIC TEXT:
- { "type": "p", "children": "paragraph text" } — regular paragraph
- { "type": "strong", "children": "bold text" } — inline bold
- { "type": "em", "children": "italic text" } — inline italic
- { "type": "code", "children": "inline code" } — inline code

CALLOUTS & HIGHLIGHTS:
- { "type": "Callout", "props": { "type": "info|warning|success|tip" }, "children": "callout text" }
- { "type": "Blockquote", "children": "key insight or pull quote" }
- { "type": "Analogy", "children": "Think of it like..." } — for analogies/metaphors

CODE & FORMULAS:
- { "type": "Code", "props": { "language": "javascript|python|json" }, "children": "code here" }
- { "type": "Formula", "props": { "label": "optional label" }, "children": "x = y + z" }

STRUCTURED DATA:
- { "type": "ul", "children": [{ "type": "li", "children": "bullet item" }] } — bullet list
- { "type": "ol", "children": [{ "type": "li", "children": "numbered item" }] } — numbered list
- { "type": "Steps", "props": { "steps": ["Step 1", "Step 2"] } } — numbered steps (or { "title": "...", "description": "..." })
- { "type": "DefinitionList", "props": { "items": [{ "term": "X", "definition": "..." }] } }
- { "type": "ComparisonTable", "props": { "headers": ["Before", "After"], "rows": [["old", "new"]] } }
- { "type": "KeyValue", "props": { "label": "Name", "value": "42", "highlight": true } }

EXAMPLES:
- { "type": "Example", "props": { "title": "Example: ..." }, "children": [...content...] }

Create a deep-dive (4-6 elements) that:
1. Opens with WHY this matters (paragraph)
2. Shows a concrete example (Code, Example, Steps, or ComparisonTable)
3. Provides an analogy or key insight (Analogy, Blockquote)
4. Lists key takeaways or steps (ul, Steps, or DefinitionList)
5. Ends with actionable insight (Callout type="tip")

Return ONLY a valid JSON array. No markdown, no preamble, just the JSON array.`

      console.log('🤖 Calling AI for structured deep dive...')
      const response = await callAI(systemPrompt, prompt)
      
      // Parse the JSON response
      let deepDiveContent
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          deepDiveContent = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON array found in response')
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse structured response, falling back to paragraphs')
        // Fallback: split into paragraphs
        const paragraphs = response.trim().split('\n\n').filter(p => p.trim())
        deepDiveContent = paragraphs.map(p => ({
          type: 'p',
          children: p.trim().replace(/^[\[\{].*[\]\}]$/gm, '').trim() || p.trim()
        }))
      }
      
      return {
        type: 'DeepDive',
        props: { 
          title: `Deep Dive: ${selectedText}`,
          defaultOpen: true 
        },
        children: deepDiveContent
      }
    }
    
    // Ask: User provides a custom question about the selected text
    if (action === 'ask' && question) {
      const prompt = `The user is reading this passage:
"${context}"

They selected the phrase: "${selectedText}"

They asked this specific question: "${question}"

Answer their question in a clear, helpful way. Focus on:
1. Directly addressing their question
2. Using the context of what they're reading
3. Providing a concrete example or analogy if helpful
4. Keeping it concise but complete (2-4 paragraphs)

Do not use markdown. Do not include preamble. Just answer the question directly.`

      console.log(`🤖 Calling AI to answer: "${question}"`)
      const answer = await callAI(systemPrompt, prompt)
      
      // Parse into paragraphs
      const paragraphs = answer.trim().split('\n\n').filter(p => p.trim())
      
      // Create a Sidebar for Q&A - collapsible to reduce clutter
      return {
        type: 'Sidebar',
        props: { 
          type: 'note',
          title: `Q: ${question.length > 40 ? question.slice(0, 40) + '...' : question}`,
          expanded: true  // Start expanded since user just asked
        },
        children: [
          ...paragraphs.map(p => ({
            type: 'p',
            children: p.trim()
          })),
          {
            type: 'p',
            props: { className: 'text-xs text-gray-400 mt-2' },
            children: `Asked about "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}" — ${timestamp}`
          }
        ]
      }
    }
    
    // Footnote: User's note, augmented by AI
    if (action === 'footnote' && question) { // 'question' param holds the user's note
      const prompt = `The user is reading this passage:
"${context}"

They selected the phrase: "${selectedText}"

They wrote this personal note/thought: "${question}"

Your job is to AUGMENT their note - expand on their idea, make connections, add depth.
Keep their original insight as the starting point, then build on it.

Guidelines:
- Start by acknowledging their insight (e.g., "Great observation!" or "Yes, and...")
- Expand with 1-2 paragraphs of relevant context
- Make connections to related concepts in the tutorial
- If they noted a question or confusion, address it
- Keep it conversational and encouraging

Do not use markdown. Write naturally.`

      console.log(`📝 Augmenting user footnote: "${question.slice(0, 50)}..."`)
      const augmented = await callAI(systemPrompt, prompt)
      const paragraphs = augmented.trim().split('\n\n').filter(p => p.trim())
      
      // Create a Sidebar for user notes - uses 'historical' type (slate) for personal annotations
      return {
        type: 'Sidebar',
        props: { 
          type: 'historical',
          title: `📝 Note: ${question.length > 35 ? question.slice(0, 35) + '...' : question}`
        },
        children: [
          {
            type: 'p',
            props: { className: 'italic border-l-2 border-slate-300 pl-3 mb-3' },
            children: `"${question}"`
          },
          ...paragraphs.map(p => ({
            type: 'p',
            children: p.trim()
          })),
          {
            type: 'p',
            props: { className: 'text-xs text-gray-400 mt-2' },
            children: `Note on "${selectedText.slice(0, 25)}..." — ${timestamp}`
          }
        ]
      }
    }
    
    // Source: Find additional learning resources
    if (action === 'source') {
      const prompt = `The user is learning about "${tutorialTitle}".

They selected the phrase: "${selectedText}"
Context: "${context.slice(0, 300)}"

Find and recommend 4-6 high-quality learning resources about this specific topic. Include a mix of:
1. **Video tutorials** (YouTube, Khan Academy, 3Blue1Brown style)
2. **Interactive resources** (online tools, visualizations, playgrounds)
3. **Articles/blog posts** (clear explanations, good examples)
4. **Academic/reference** (Wikipedia, textbooks, papers for deeper study)

For each resource, provide:
- Title (be specific)
- Type (Video/Interactive/Article/Reference)
- URL (use real, working URLs - if unsure, use search URLs)
- One sentence explaining why it's helpful for understanding "${selectedText}"

Format your response as a JSON array:
[
  {"title": "...", "type": "Video", "url": "...", "why": "..."},
  ...
]

Only output the JSON array, nothing else.`

      console.log(`📚 Finding sources for: "${selectedText.slice(0, 50)}..."`)
      let sources = []
      try {
        const response = await callAI(systemPrompt, prompt)
        // Parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          sources = JSON.parse(jsonMatch[0])
        }
      } catch (parseErr) {
        console.error('Failed to parse sources JSON:', parseErr.message)
        // Fallback: generate search links
        sources = [
          { title: `Search YouTube for "${selectedText}"`, type: 'Video', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedText + ' tutorial')}`, why: 'Video explanations often make concepts click' },
          { title: `Search Khan Academy`, type: 'Interactive', url: `https://www.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(selectedText)}`, why: 'Free, structured lessons with practice problems' },
          { title: `Wikipedia: ${selectedText}`, type: 'Reference', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedText.replace(/ /g, '_'))}`, why: 'Good starting point for definitions and context' },
        ]
      }
      
      // Create a Sidebar with clickable source links
      const typeIcons = {
        'Video': '🎬',
        'Interactive': '🎮',
        'Article': '📄',
        'Reference': '📖',
        'Course': '🎓'
      }
      
      return {
        type: 'Sidebar',
        props: { 
          type: 'tip',
          title: `📚 Learn More: ${selectedText.length > 30 ? selectedText.slice(0, 30) + '...' : selectedText}`
        },
        children: [
          {
            type: 'p',
            props: { className: 'text-sm text-gray-600 mb-3' },
            children: 'Curated resources to deepen your understanding:'
          },
          ...sources.map(src => ({
            type: 'p',
            props: { className: 'mb-2' },
            children: [
              {
                type: 'a',
                props: { 
                  href: src.url, 
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'text-blue-600 hover:text-blue-800 font-medium'
                },
                children: `${typeIcons[src.type] || '🔗'} ${src.title}`
              },
              {
                type: 'span',
                props: { className: 'text-xs text-gray-500 ml-2' },
                children: `(${src.type})`
              },
              src.why ? {
                type: 'span',
                props: { className: 'block text-sm text-gray-600 ml-6' },
                children: src.why
              } : null
            ].filter(Boolean)
          })),
          {
            type: 'p',
            props: { className: 'text-xs text-gray-400 mt-3' },
            children: `Sources for "${selectedText.slice(0, 25)}..." — ${timestamp}`
          }
        ]
      }
    }
    
    return null
    
  } catch (error) {
    console.error('❌ AI error:', error.message)
    
    // Return error callout
    return {
      type: 'Callout',
      props: { type: 'warning' },
      children: [
        {
          type: 'strong',
          children: `⚠️ "${selectedText}":`
        },
        ' ',
        `AI generation failed: ${error.message}. Please try again.`,
        ' ',
        {
          type: 'em',
          props: { className: 'text-gray-400 text-xs' },
          children: `(${timestamp})`
        }
      ]
    }
  }
}

/**
 * Generate a unique ID for annotations
 */
function generateAnnotationId() {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

/**
 * Find and insert annotation into content tree
 * Also inserts an inline marker at the source text location
 */

/**
 * Recursively find all annotation elements in content
 * This includes Sidebars, DeepDives, Q&A Callouts, footnotes, etc.
 * Now also captures surrounding context for better AI decisions
 */
function findAllAnnotations(node, path = '', parent = null, siblingIndex = -1) {
  const annotations = []
  
  if (!node) return annotations
  
  // Helper to get context from siblings
  const getContext = () => {
    if (!parent || !Array.isArray(parent.children)) return { before: '', after: '' }
    const siblings = parent.children
    
    let before = ''
    let after = ''
    
    // Get text from previous siblings (up to 300 chars)
    for (let i = siblingIndex - 1; i >= 0 && before.length < 300; i--) {
      const text = extractTextContent(siblings[i])
      if (text) before = text.slice(-300) + ' ' + before
    }
    
    // Get text from next siblings (up to 300 chars)
    for (let i = siblingIndex + 1; i < siblings.length && after.length < 300; i++) {
      const text = extractTextContent(siblings[i])
      if (text) after = after + ' ' + text.slice(0, 300)
    }
    
    return { 
      before: before.trim().slice(-300), 
      after: after.trim().slice(0, 300) 
    }
  }
  
  // Sidebar annotations
  if (node.type === 'Sidebar') {
    const ctx = getContext()
    annotations.push({
      type: 'sidebar',
      subtype: node.props?.type || 'note',
      title: node.props?.title || 'Untitled',
      content: extractTextContent(node.children).slice(0, 200),
      contextBefore: ctx.before,
      contextAfter: ctx.after,
      path
    })
  }
  
  // DeepDive sections (often from "Go Deeper")
  if (node.type === 'DeepDive') {
    const ctx = getContext()
    annotations.push({
      type: 'deepdive',
      title: node.props?.title || 'Deep Dive',
      content: extractTextContent(node.children).slice(0, 200),
      contextBefore: ctx.before,
      contextAfter: ctx.after,
      path
    })
  }
  
  // Callouts with 💡 (inline explanations)
  if (node.type === 'Callout' && extractTextContent(node.children).includes('💡')) {
    const ctx = getContext()
    annotations.push({
      type: 'explanation',
      content: extractTextContent(node.children).slice(0, 200),
      contextBefore: ctx.before,
      contextAfter: ctx.after,
      path
    })
  }
  
  // Q&A style annotations (buttons with ❓)
  if (node.type === 'button' && node.children && extractTextContent(node.children).includes('❓')) {
    const ctx = getContext()
    annotations.push({
      type: 'question',
      content: extractTextContent(node.children).slice(0, 200),
      contextBefore: ctx.before,
      contextAfter: ctx.after,
      path
    })
  }
  
  // Footnote annotations
  if (node.type === 'Footnote') {
    const ctx = getContext()
    annotations.push({
      type: 'footnote',
      reference: node.props?.reference,
      content: extractTextContent(node.children).slice(0, 200),
      contextBefore: ctx.before,
      contextAfter: ctx.after,
      path
    })
  }
  
  // Recurse into children
  if (node.children) {
    const children = Array.isArray(node.children) ? node.children : [node.children]
    children.forEach((child, i) => {
      if (typeof child === 'object') {
        annotations.push(...findAllAnnotations(child, `${path}.children[${i}]`, node, i))
      }
    })
  }
  
  return annotations
}

/**
 * Remove an element at a given path from the content tree
 * Path format: ".children[0].children[2]" etc.
 */
function removeAtPath(content, path) {
  if (!path || path === '') return false
  
  // Parse the path to get parent path and index
  const match = path.match(/^(.*)\.children\[(\d+)\]$/)
  if (!match) {
    console.error('Invalid path format:', path)
    return false
  }
  
  const parentPath = match[1]
  const index = parseInt(match[2])
  
  // Navigate to parent
  let parent = content
  if (parentPath) {
    const parts = parentPath.match(/\.children\[(\d+)\]/g) || []
    for (const part of parts) {
      const idx = parseInt(part.match(/\d+/)[0])
      if (!parent.children || !Array.isArray(parent.children)) return false
      parent = parent.children[idx]
    }
  }
  
  // Remove the element
  if (parent.children && Array.isArray(parent.children) && index < parent.children.length) {
    parent.children.splice(index, 1)
    return true
  }
  
  return false
}

/**
 * Get element at a given path
 */
function getAtPath(content, path) {
  if (!path || path === '') return content
  
  let current = content
  const parts = path.match(/\.children\[(\d+)\]/g) || []
  
  for (const part of parts) {
    const idx = parseInt(part.match(/\d+/)[0])
    if (!current.children || !Array.isArray(current.children)) return null
    current = current.children[idx]
  }
  
  return current
}

/**
 * Set element at a given path
 */
function setAtPath(content, path, newValue) {
  if (!path || path === '') return false
  
  // Parse the path to get parent path and index
  const match = path.match(/^(.*)\.children\[(\d+)\]$/)
  if (!match) {
    // Path might be just ".children[X]" with no parent
    const simpleMatch = path.match(/^\.children\[(\d+)\]$/)
    if (simpleMatch) {
      const idx = parseInt(simpleMatch[1])
      if (content.children && Array.isArray(content.children) && idx < content.children.length) {
        content.children[idx] = newValue
        return true
      }
    }
    return false
  }
  
  const parentPath = match[1]
  const index = parseInt(match[2])
  
  // Navigate to parent
  let parent = content
  if (parentPath) {
    const parts = parentPath.match(/\.children\[(\d+)\]/g) || []
    for (const part of parts) {
      const idx = parseInt(part.match(/\d+/)[0])
      if (!parent.children || !Array.isArray(parent.children)) return false
      parent = parent.children[idx]
    }
  }
  
  // Set the element
  if (parent.children && Array.isArray(parent.children) && index < parent.children.length) {
    parent.children[index] = newValue
    return true
  }
  
  return false
}

/**
 * Remove inline markers (❓, 💡) that point to a removed annotation
 * These markers are usually in the element BEFORE the annotation
 */
function removeInlineMarker(content, annotationPath) {
  // Parse the path to find the parent and annotation index
  const match = annotationPath.match(/^(.*)\.children\[(\d+)\]$/)
  if (!match) return false
  
  const parentPath = match[1]
  const annotationIndex = parseInt(match[2])
  
  // Get the parent element
  let parent = content
  if (parentPath) {
    const parts = parentPath.match(/\.children\[(\d+)\]/g) || []
    for (const part of parts) {
      const idx = parseInt(part.match(/\d+/)[0])
      if (!parent.children || !Array.isArray(parent.children)) return false
      parent = parent.children[idx]
    }
  }
  
  if (!parent.children || !Array.isArray(parent.children)) return false
  
  // Look at the element BEFORE the annotation for inline markers
  // The marker is typically a span with ❓ or 💡 or 📝 that was inserted
  for (let i = annotationIndex - 1; i >= 0 && i >= annotationIndex - 2; i--) {
    const sibling = parent.children[i]
    if (sibling && typeof sibling === 'object') {
      // Check if this element contains a marker
      const text = extractTextContent(sibling)
      if (text.includes('❓') || text.includes('💡') || text.includes('📝')) {
        // This might be a marker element - check if it's small (just the marker)
        if (text.length < 10) {
          parent.children.splice(i, 1)
          return true
        }
        // Or it might be embedded in text - try to clean it
        cleanMarkersFromElement(sibling)
        return true
      }
    }
  }
  
  return false
}

/**
 * Remove marker characters from text content recursively
 */
function cleanMarkersFromElement(node) {
  if (!node) return
  
  if (typeof node.children === 'string') {
    node.children = node.children.replace(/[❓💡📝]\s*/g, '')
  } else if (Array.isArray(node.children)) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i]
      if (typeof child === 'string') {
        const cleaned = child.replace(/[❓💡📝]\s*/g, '')
        if (cleaned) {
          node.children[i] = cleaned
        } else {
          node.children.splice(i, 1)
        }
      } else if (typeof child === 'object') {
        cleanMarkersFromElement(child)
      }
    }
  }
}

/**
 * Recursively find all Sidebar elements in content (legacy, for backward compat)
 */
function findSidebars(node, path = '') {
  const sidebars = []
  
  if (!node) return sidebars
  
  if (node.type === 'Sidebar') {
    const contentPreview = extractTextContent(node.children).slice(0, 100)
    sidebars.push({
      type: node.props?.type || 'note',
      title: node.props?.title || 'Untitled',
      contentPreview,
      path
    })
  }
  
  if (node.children) {
    const children = Array.isArray(node.children) ? node.children : [node.children]
    children.forEach((child, i) => {
      if (typeof child === 'object') {
        sidebars.push(...findSidebars(child, `${path}.children[${i}]`))
      }
    })
  }
  
  return sidebars
}

/**
 * Extract plain text from content tree
 */
function extractTextContent(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractTextContent).join(' ')
  if (node.children) return extractTextContent(node.children)
  return ''
}

function insertAnnotation(content, selectedText, annotation, action) {
  const newContent = JSON.parse(JSON.stringify(content))
  const annotationId = generateAnnotationId()
  const sourceId = `source-${annotationId}` // ID for the source text location
  
  // Add ID to the annotation for linking, and sourceId for back-linking
  annotation.props = annotation.props || {}
  annotation.props.id = annotationId
  annotation.props.sourceId = sourceId
  
  // Create inline marker that links to the annotation (superscript style)
  const inlineMarker = {
    type: 'FootnoteRef',
    props: { 
      id: sourceId,
      targetId: annotationId, 
      type: action,
    }
  }
  
  let insertionPoint = null // Track where we'll insert the deep dive
  
  /**
   * Deep search for text in any string property
   */
  function findTextInNode(node, path = []) {
    if (typeof node === 'string') {
      if (node.includes(selectedText)) {
        return { found: true, path, node }
      }
      return { found: false }
    }
    
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const result = findTextInNode(node[i], [...path, i])
        if (result.found) return result
      }
      return { found: false }
    }
    
    if (node && typeof node === 'object') {
      // Check children
      if (node.children !== undefined) {
        const result = findTextInNode(node.children, [...path, 'children'])
        if (result.found) return result
      }
      
      // Check props.children
      if (node.props?.children !== undefined) {
        const result = findTextInNode(node.props.children, [...path, 'props', 'children'])
        if (result.found) return result
      }
      
      // Check props.steps (for Steps component)
      if (node.props?.steps) {
        for (let i = 0; i < node.props.steps.length; i++) {
          const step = node.props.steps[i]
          if (typeof step === 'string' && step.includes(selectedText)) {
            return { found: true, path: [...path, 'props', 'steps', i], node: step }
          }
          if (typeof step === 'object') {
            if (step.title?.includes(selectedText)) {
              return { found: true, path: [...path, 'props', 'steps', i, 'title'], node: step.title }
            }
            if (step.description?.includes(selectedText)) {
              return { found: true, path: [...path, 'props', 'steps', i, 'description'], node: step.description }
            }
          }
        }
      }
      
      // Check props.items (for DefinitionList)
      if (node.props?.items) {
        for (let i = 0; i < node.props.items.length; i++) {
          const item = node.props.items[i]
          if (item.term?.includes(selectedText)) {
            return { found: true, path: [...path, 'props', 'items', i, 'term'], node: item.term }
          }
          if (item.definition?.includes(selectedText)) {
            return { found: true, path: [...path, 'props', 'items', i, 'definition'], node: item.definition }
          }
        }
      }
      
      // Check props.rows (for ComparisonTable)
      if (node.props?.rows) {
        for (let i = 0; i < node.props.rows.length; i++) {
          for (let j = 0; j < node.props.rows[i].length; j++) {
            if (typeof node.props.rows[i][j] === 'string' && node.props.rows[i][j].includes(selectedText)) {
              return { found: true, path: [...path, 'props', 'rows', i, j], node: node.props.rows[i][j] }
            }
          }
        }
      }
    }
    
    return { found: false }
  }
  
  /**
   * Get value at path in object
   */
  function getAtPath(obj, path) {
    let current = obj
    for (const key of path) {
      if (current === undefined) return undefined
      current = current[key]
    }
    return current
  }
  
  /**
   * Set value at path in object
   */
  function setAtPath(obj, path, value) {
    let current = obj
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
  }
  
  /**
   * Find the nearest Section ancestor and insert after the element containing the text
   */
  function findInsertionPoint(path) {
    // Walk up the path to find a Section or the element we should insert after
    for (let i = path.length - 1; i >= 0; i--) {
      const partialPath = path.slice(0, i)
      const node = getAtPath(newContent.content, partialPath)
      
      if (node?.type === 'Section') {
        // Insert at end of this section's children
        return { sectionPath: partialPath, insertIndex: node.children?.length || 0 }
      }
    }
    return null
  }
  
  // Search for the text
  const searchResult = findTextInNode(newContent.content)
  
  if (searchResult.found) {
    console.log(`✅ Found text at path: ${searchResult.path.join('.')}`)
    
    // FIRST: Check if this is inside a structured data component where inline markers don't work
    const isInStructuredData = searchResult.path.some((p, i) => {
      if (p === 'rows' || p === 'headers') return true // ComparisonTable
      if (p === 'items' && searchResult.path[i-1] === 'props') return true // DefinitionList
      return false
    })
    
    if (isInStructuredData) {
      console.log(`⚠️ Text found in structured data component (table/list) - using row highlight instead of inline marker`)
      
      // For ComparisonTable: add row highlighting
      const rowsIndex = searchResult.path.indexOf('rows')
      if (rowsIndex !== -1) {
        // Path looks like: [..., 'props', 'rows', rowIndex, cellIndex]
        const rowIndex = searchResult.path[rowsIndex + 1]
        const tablePath = searchResult.path.slice(0, rowsIndex - 1) // Path to the ComparisonTable element
        const tableNode = getAtPath(newContent.content, tablePath)
        
        if (tableNode && tableNode.type === 'ComparisonTable') {
          // Add highlight info to the table
          tableNode.props = tableNode.props || {}
          tableNode.props.highlightRows = tableNode.props.highlightRows || []
          if (!tableNode.props.highlightRows.includes(rowIndex)) {
            tableNode.props.highlightRows.push(rowIndex)
          }
          tableNode.props.highlightId = annotationId
          console.log(`✅ Added row ${rowIndex} highlight to ComparisonTable, linking to ${annotationId}`)
        }
      }
      // Skip inline marker insertion - go directly to DeepDive insertion
    } else {
      // Try to insert inline marker by converting the string to an array with marker
      const parentPath = searchResult.path.slice(0, -1)
      const textKey = searchResult.path[searchResult.path.length - 1]
      const parent = getAtPath(newContent.content, parentPath)
      
      // Case 1: Parent is an array, text is at index textKey
      if (Array.isArray(parent) && typeof textKey === 'number') {
        const originalText = parent[textKey]
        const selectIndex = originalText.indexOf(selectedText)
        
        if (selectIndex !== -1) {
          const before = originalText.slice(0, selectIndex + selectedText.length)
          const after = originalText.slice(selectIndex + selectedText.length)
          
          // Replace the single string with multiple elements
          const replacement = [before, inlineMarker]
          if (after.trim()) replacement.push(after)
          
          parent.splice(textKey, 1, ...replacement)
          console.log(`✅ Inserted inline marker (array case) after "${selectedText.slice(0, 30)}..."`)
        }
      }
      // Case 2: Parent is an object, text is at key 'children' (e.g., { type: "p", children: "text" })
      else if (parent && typeof parent === 'object' && textKey === 'children' && typeof parent.children === 'string') {
        const originalText = parent.children
        const selectIndex = originalText.indexOf(selectedText)
        
        if (selectIndex !== -1) {
          const before = originalText.slice(0, selectIndex + selectedText.length)
          const after = originalText.slice(selectIndex + selectedText.length)
          
          // Convert children from string to array with marker
          const newChildren = [before, inlineMarker]
          if (after.trim()) newChildren.push(after)
          
          parent.children = newChildren
          console.log(`✅ Inserted inline marker (object.children case) after "${selectedText.slice(0, 30)}..."`)
        }
      }
      // Case 3: Nested in props.children
      else if (parent && typeof parent === 'object' && textKey === 'children' && parent.props?.children) {
        // This handles cases where the path ends in props.children
        const grandparentPath = searchResult.path.slice(0, -2)
        const grandparent = getAtPath(newContent.content, grandparentPath)
        
        if (grandparent && typeof grandparent.props?.children === 'string') {
          const originalText = grandparent.props.children
          const selectIndex = originalText.indexOf(selectedText)
          
          if (selectIndex !== -1) {
            const before = originalText.slice(0, selectIndex + selectedText.length)
            const after = originalText.slice(selectIndex + selectedText.length)
            
            const newChildren = [before, inlineMarker]
            if (after.trim()) newChildren.push(after)
            
            grandparent.props.children = newChildren
            console.log(`✅ Inserted inline marker (props.children case) after "${selectedText.slice(0, 30)}..."`)
          }
        }
      }
      else {
        console.log(`⚠️ Could not insert inline marker - unhandled parent structure`)
      }
    }
    
    // Find where to insert the deep dive
    const insertPoint = findInsertionPoint(searchResult.path)
    
    if (insertPoint) {
      // Insert the annotation in the section
      const section = getAtPath(newContent.content, insertPoint.sectionPath)
      if (!section.children) section.children = []
      
      // Find the index of the element containing our text and insert after it
      const containingElementIndex = searchResult.path[insertPoint.sectionPath.length + 1]
      if (typeof containingElementIndex === 'number') {
        section.children.splice(containingElementIndex + 1, 0, annotation)
        console.log(`✅ Inserted annotation after element at index ${containingElementIndex}`)
      } else {
        section.children.push(annotation)
        console.log(`✅ Appended annotation to section`)
      }
    } else {
      // Fallback: insert after the current top-level section
      const topLevelIndex = searchResult.path[1] // path[0] is 'children'
      if (typeof topLevelIndex === 'number' && newContent.content.children) {
        newContent.content.children.splice(topLevelIndex + 1, 0, {
          type: 'Section',
          children: [annotation]
        })
        console.log(`✅ Inserted as new section after index ${topLevelIndex}`)
      }
    }
    
    return newContent
  }
  
  console.log(`⚠️ Text "${selectedText.slice(0, 30)}..." not found, appending to end`)
  if (newContent.content?.children) {
    newContent.content.children.push({
      type: 'Section',
      children: [annotation]
    })
  }
  
  return newContent
}

/**
 * Commit and push to Git
 */
async function commitAndPush(filePath, message) {
  try {
    const relativePath = path.relative(TUTORIALS_REPO, filePath)
    const safeMessage = message.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$')
    execSync(`git add "${relativePath}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
    execSync(`git commit -m "${safeMessage}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
    execSync('git push', { cwd: TUTORIALS_REPO, stdio: 'pipe' })
    console.log(`✅ Git: ${message}`)
    return true
  } catch (error) {
    console.log(`⚠️ Git failed: ${error.message?.slice(0, 100)}`)
    return false
  }
}

/**
 * Handle requests
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    return res.end()
  }
  
  if (url.pathname === '/health' && req.method === 'GET') {
    const aiInfo = getAIInfo()
    return sendJson(res, 200, { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ai: aiInfo
    })
  }
  
  if (url.pathname === '/tutorials' && req.method === 'GET') {
    try {
      const files = await fs.readdir(CONTENT_DIR)
      const tutorials = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
      return sendJson(res, 200, { tutorials })
    } catch (error) {
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Fetch a single tutorial (avoids import caching issues)
  if (url.pathname.startsWith('/api/tutorial/') && req.method === 'GET') {
    try {
      const tutorialId = url.pathname.replace('/api/tutorial/', '')
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      return sendJson(res, 200, content)
    } catch (error) {
      return sendJson(res, 404, { error: `Tutorial not found: ${error.message}` })
    }
  }
  
  if (url.pathname === '/annotate' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      let { action, selectedText, context, tutorialId, question } = body
      
      // Ensure selectedText is a string
      if (selectedText && typeof selectedText !== 'string') {
        selectedText = String(selectedText)
      }
      
      console.log('\n📝 Annotation Request:')
      console.log(`  Action: ${action}`)
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Selected: "${selectedText?.slice?.(0, 50) || selectedText}..."`)
      if (question) console.log(`  Question: "${question?.slice?.(0, 50) || question}..."`)
      
      if (!action || !selectedText || !tutorialId) {
        return sendJson(res, 400, { error: 'Missing required fields' })
      }
      
      if (!['explain', 'branch', 'ask', 'footnote', 'source'].includes(action)) {
        return sendJson(res, 400, { error: 'Action must be explain, branch, ask, footnote, or source' })
      }
      
      if (action === 'ask' && !question) {
        return sendJson(res, 400, { error: 'Question is required for ask action' })
      }
      
      // Map engine tutorial IDs to their JSON filenames
      const jsonFilenames = {
        'matrix-from-vectors-engine': 'matrix-from-vectors',
        'matrix-discovery-engine': 'matrix-discovery',
        'lead-lag-correlation-engine': 'lead-lag-correlation',
        'least-squares-engine': 'least-squares'
      }
      const jsonFilename = jsonFilenames[tutorialId] || tutorialId
      
      const jsonPath = path.join(CONTENT_DIR, `${jsonFilename}.json`)
      let content
      try {
        content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      } catch {
        return sendJson(res, 404, { error: `Tutorial not found: ${tutorialId}` })
      }
      
      console.log(`🤖 Generating ${action} annotation...`)
      const annotation = await generateAnnotation(
        action, 
        selectedText, 
        context || '', 
        content.title,
        question // Pass question for 'ask' action
      )
      if (!annotation) {
        return sendJson(res, 500, { error: 'Failed to generate annotation' })
      }
      console.log(`✅ Annotation generated`)
      
      const updatedContent = insertAnnotation(content, selectedText, annotation, action)
      
      await fs.writeFile(jsonPath, JSON.stringify(updatedContent, null, 2))
      console.log(`💾 Saved: ${jsonPath}`)
      
      const commitMsg = `[${action}] "${String(selectedText).slice(0, 40)}..." in ${tutorialId}`
      commitAndPush(jsonPath, commitMsg).catch(() => {})
      
      return sendJson(res, 200, {
        success: true,
        action,
        tutorialId,
        selectedText,
        updatedContent
      })
      
    } catch (error) {
      console.error('❌ Error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Regroup and Reorganize endpoint - treats annotations as editor's notes
  if (url.pathname === '/regroup' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, aggressive = false, apply = false } = body
      
      console.log('\n🔄 Regroup Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Mode: ${aggressive ? 'aggressive' : 'conservative'}`)
      console.log(`  Apply: ${apply ? 'YES' : 'preview only'}`)
      
      if (!tutorialId) {
        return sendJson(res, 400, { error: 'Missing tutorialId' })
      }
      
      // Map engine tutorial IDs to their JSON filenames
      const jsonFilenames = {
        'matrix-from-vectors-engine': 'matrix-from-vectors',
        'matrix-discovery-engine': 'matrix-discovery',
        'lead-lag-correlation-engine': 'lead-lag-correlation',
        'least-squares-engine': 'least-squares'
      }
      
      const filename = jsonFilenames[tutorialId] || tutorialId
      const jsonPath = path.join(CONTENT_DIR, `${filename}.json`)
      
      let content
      try {
        content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      } catch {
        return sendJson(res, 404, { error: `Tutorial not found: ${tutorialId}` })
      }
      
      // Find ALL annotations (sidebars, deepdives, callouts, Q&A, etc.)
      const annotations = findAllAnnotations(content.content)
      console.log(`  Found ${annotations.length} annotations to review`)
      
      if (annotations.length === 0) {
        return sendJson(res, 200, { 
          success: true, 
          message: 'No annotations found - tutorial is clean',
          changes: 0,
          updatedContent: content
        })
      }
      
      // PHASE 1: Scan for META-ANNOTATIONS (requests for structural changes)
      // These are "editor's notes" about how to reorganize, not just content to add
      
      const metaPatterns = {
        // New section requests
        newSection: [
          /should (have|add|create|include) (a |an )?(new |major |entire )?section/i,
          /needs? (its own|a dedicated|a separate) (section|chapter)/i,
          /missing:?\s*(section|chapter|explanation)/i,
          /TODO:?\s*(add|create|expand|write)/i,
          /this (deserves|warrants|needs) (its own|a) section/i,
          /we need to (add|cover|explain)/i,
          /go deeper/i  // "Go Deeper" annotations suggest structural expansion
        ],
        // Reorganization requests
        reorganize: [
          /move (all |the )?(references?|mentions?|discussion) (of |to |about )/i,
          /should (come|go|be) (before|after|earlier|later)/i,
          /consolidate (the |all )?(examples?|explanations?|references?)/i,
          /(duplicates?|repeats?) what we (said|explained|covered)/i,
          /reorganize|restructure|reorder/i,
          /merge (this |these )?(with|into)/i,
          /split (this|the) (section|paragraph)/i,
          /belongs? (in|with|under) (the |a )?(section|part)/i
        ],
        // Content gaps
        contentGap: [
          /need(s)? (more |better |an? )?(explanation|detail|example)/i,
          /unclear|confusing|vague/i,
          /what (about|is|does)/i,
          /how does this (relate|connect)/i
        ]
      }
      
      const metaAnnotations = {
        newSection: [],
        reorganize: [],
        contentGap: []
      }
      
      annotations.forEach(ann => {
        const text = ann.content || ''
        
        // DeepDive elements are always structural expansion requests
        if (ann.type === 'deepdive') {
          metaAnnotations.newSection.push(ann)
        } else if (metaPatterns.newSection.some(p => p.test(text))) {
          metaAnnotations.newSection.push(ann)
        } else if (metaPatterns.reorganize.some(p => p.test(text))) {
          metaAnnotations.reorganize.push(ann)
        } else if (metaPatterns.contentGap.some(p => p.test(text))) {
          metaAnnotations.contentGap.push(ann)
        }
      })
      
      const totalMeta = metaAnnotations.newSection.length + metaAnnotations.reorganize.length + metaAnnotations.contentGap.length
      
      if (totalMeta > 0) {
        console.log(`  📋 Found ${totalMeta} META-ANNOTATION(S):`)
        if (metaAnnotations.newSection.length > 0) {
          console.log(`     🆕 New sections: ${metaAnnotations.newSection.length}`)
          metaAnnotations.newSection.forEach(m => console.log(`        - "${m.content?.slice(0, 50)}..."`))
        }
        if (metaAnnotations.reorganize.length > 0) {
          console.log(`     🔄 Reorganization: ${metaAnnotations.reorganize.length}`)
          metaAnnotations.reorganize.forEach(m => console.log(`        - "${m.content?.slice(0, 50)}..."`))
        }
        if (metaAnnotations.contentGap.length > 0) {
          console.log(`     📝 Content gaps: ${metaAnnotations.contentGap.length}`)
          metaAnnotations.contentGap.forEach(m => console.log(`        - "${m.content?.slice(0, 50)}..."`))
        }
      }
      
      // Build rich annotation summary with context
      const annotationSummary = annotations.map((a, i) => {
        let summary = `${i+1}. [${a.type}${a.subtype ? ':'+a.subtype : ''}] ${a.title || ''}\n`
        summary += `   Content: "${a.content}"\n`
        if (a.contextBefore) {
          summary += `   BEFORE: "...${a.contextBefore}"\n`
        }
        if (a.contextAfter) {
          summary += `   AFTER: "${a.contextAfter}..."\n`
        }
        return summary
      }).join('\n')
      
      // Group annotations by their parent section
      const sectionAnnotations = new Map() // sectionPath -> { section, annotations }
      
      for (const ann of annotations) {
        // Find the Section that contains this annotation
        // Path looks like ".children[1].children[3]" - find the Section level
        const pathParts = ann.path.match(/\.children\[(\d+)\]/g) || []
        if (pathParts.length < 2) continue
        
        // The section is typically the first or second level
        let sectionPath = pathParts[0] // e.g., ".children[1]"
        let section = getAtPath(content.content, sectionPath)
        
        // If it's not a Section, try one level deeper
        if (!section || section.type !== 'Section') {
          if (pathParts.length >= 2) {
            sectionPath = pathParts.slice(0, 2).join('')
            section = getAtPath(content.content, sectionPath)
          }
        }
        
        if (section && section.type === 'Section') {
          if (!sectionAnnotations.has(sectionPath)) {
            sectionAnnotations.set(sectionPath, { 
              section, 
              sectionPath,
              sectionTitle: section.props?.title || 'Untitled Section',
              annotations: [] 
            })
          }
          sectionAnnotations.get(sectionPath).annotations.push(ann)
        }
      }
      
      console.log(`📚 Found annotations in ${sectionAnnotations.size} section(s)`)
      
      if (sectionAnnotations.size === 0 && totalMeta === 0) {
        return sendJson(res, 200, {
          success: true,
          preview: true,
          message: 'No sections with annotations found to rewrite',
          changes: [],
          updatedContent: content
        })
      }
      
      // Build preview: one entry per section that will be rewritten
      const changes = []
      for (const [path, { sectionTitle, annotations: sectionAnns }] of sectionAnnotations) {
        changes.push({
          action: 'edit',
          sectionTitle,
          sectionPath: path,
          annotationCount: sectionAnns.length,
          preview: sectionAnns.map(a => a.content?.slice(0, 50)).join('; ')
        })
      }
      
      // Add meta-annotation changes to preview
      const metaChanges = []
      
      // New section requests
      for (const meta of metaAnnotations.newSection) {
        metaChanges.push({
          action: 'new_section',
          annotation: meta.content?.slice(0, 100),
          icon: '🆕'
        })
      }
      
      // Reorganization requests
      for (const meta of metaAnnotations.reorganize) {
        metaChanges.push({
          action: 'reorganize',
          annotation: meta.content?.slice(0, 100),
          icon: '🔄'
        })
      }
      
      // Content gap requests
      for (const meta of metaAnnotations.contentGap) {
        metaChanges.push({
          action: 'content_gap',
          annotation: meta.content?.slice(0, 100),
          icon: '📝'
        })
      }
      
      // If preview mode, return the plan
      if (!apply) {
        console.log('📋 Preview only - no changes applied')
        
        const metaCounts = {
          newSection: metaAnnotations.newSection.length,
          reorganize: metaAnnotations.reorganize.length,
          contentGap: metaAnnotations.contentGap.length
        }
        
        let message = ''
        if (totalMeta > 0) {
          const parts = []
          if (metaCounts.newSection) parts.push(`${metaCounts.newSection} new section request(s)`)
          if (metaCounts.reorganize) parts.push(`${metaCounts.reorganize} reorganization request(s)`)
          if (metaCounts.contentGap) parts.push(`${metaCounts.contentGap} content gap(s)`)
          message = `Found: ${parts.join(', ')}`
          if (sectionAnnotations.size > 0) {
            message += ` + ${sectionAnnotations.size} section(s) to edit`
          }
        } else {
          message = `Will edit ${sectionAnnotations.size} section(s) to incorporate ${annotations.length} annotation insights`
        }
        
        return sendJson(res, 200, {
          success: true,
          preview: true,
          tutorialId,
          annotationCount: annotations.length,
          sectionCount: sectionAnnotations.size,
          metaAnnotationCount: totalMeta,
          metaCounts,
          changes: [...metaChanges, ...changes],
          message,
          updatedContent: content
        })
      }
      
      // APPLY MODE: First handle meta-annotations (new sections)
      console.log('🔧 Applying changes...')
      let updatedContent = JSON.parse(JSON.stringify(content)) // Deep clone
      let totalEdits = 0
      let newSectionsCreated = 0
      
      // Process NEW SECTION requests
      if (metaAnnotations.newSection.length > 0) {
        console.log(`\n🆕 Processing ${metaAnnotations.newSection.length} new section request(s)...`)
        
        for (const meta of metaAnnotations.newSection) {
          console.log(`  📋 Request: "${meta.content?.slice(0, 60)}..."`)
          
          try {
            const newSectionPrompt = `A reader has requested a new section be added to an educational tutorial.

READER REQUEST:
"${meta.content}"

CONTEXT (where this was noted):
${meta.contextBefore ? `Before: "${meta.contextBefore}"` : ''}
${meta.contextAfter ? `After: "${meta.contextAfter}"` : ''}

Generate a new tutorial section that addresses this request. Return JSON:
{
  "title": "Section Title",
  "content": [
    { "type": "p", "text": "First paragraph..." },
    { "type": "p", "text": "Second paragraph..." }
  ]
}

GUIDELINES:
- Keep paragraphs SHORT (3-4 sentences)
- Be educational and clear
- Include 2-4 paragraphs
- Title should be descriptive

Return ONLY valid JSON.`

            const response = await callAI(
              'You are an expert educational content creator. Write clear, engaging tutorial content.',
              newSectionPrompt
            )
            
            let sectionData
            try {
              let jsonStr = response.trim()
              if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
              if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
              if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
              sectionData = JSON.parse(jsonStr.trim())
            } catch (e) {
              console.log(`    ❌ Failed to parse new section: ${e.message}`)
              continue
            }
            
            // Build the new section structure
            const newSection = {
              type: 'Section',
              props: { title: sectionData.title },
              children: [
                { type: 'h3', children: sectionData.title },
                ...sectionData.content.map(p => ({
                  type: 'p',
                  children: p.text || p
                }))
              ]
            }
            
            // Insert before References section (or at end)
            const contentChildren = updatedContent.content.children
            let insertIndex = contentChildren.length
            for (let i = 0; i < contentChildren.length; i++) {
              if (contentChildren[i].props?.title?.toLowerCase().includes('reference') ||
                  contentChildren[i].props?.title?.toLowerCase().includes('takeaway')) {
                insertIndex = i
                break
              }
            }
            
            contentChildren.splice(insertIndex, 0, newSection)
            newSectionsCreated++
            totalEdits++
            console.log(`    ✅ Created new section: "${sectionData.title}"`)
            
          } catch (e) {
            console.error(`    ❌ Failed to create section: ${e.message}`)
          }
        }
      }
      
      // Then process regular section edits
      for (const [sectionPath, { section, sectionTitle, annotations: sectionAnns }] of sectionAnnotations) {
        console.log(`\n📝 Processing section: "${sectionTitle}" (${sectionAnns.length} annotations)`)
        
        // Extract paragraphs from section (text content in p elements)
        const paragraphs = []
        const paragraphPaths = []
        
        if (section.children && Array.isArray(section.children)) {
          section.children.forEach((child, idx) => {
            if (child.type === 'p') {
              const text = extractTextContent(child)
              if (text.trim()) {
                paragraphs.push(text)
                paragraphPaths.push(`${sectionPath}.children[${idx}]`)
              }
            }
          })
        }
        
        if (paragraphs.length === 0) {
          console.log('  ⚠️ No paragraphs found in section, skipping')
          continue
        }
        
        // Build annotation summary
        const annSummary = sectionAnns.map((a, i) => 
          `${i+1}. [${a.type}] ${a.title || ''}: "${a.content}"`
        ).join('\n')
        
        try {
          const editPrompt = `You are improving an educational tutorial by incorporating reader feedback.

SECTION: "${sectionTitle}"

CURRENT PARAGRAPHS:
${paragraphs.map((p, i) => `[${i}] ${p}`).join('\n\n')}

ANNOTATIONS TO INCORPORATE:
${annSummary}

Return a JSON array of edits. AVAILABLE EDIT TYPES:

1. "expand" - Add 1-2 sentences to an existing paragraph
   { "type": "expand", "paragraphIndex": 0, "addSentences": "New sentences." }

2. "insert_paragraph" - Add a new paragraph after an existing one  
   { "type": "insert_paragraph", "afterIndex": 0, "text": "New paragraph." }

3. "sidebar" - Add a sidebar for tangential/advanced info
   { "type": "sidebar", "afterIndex": 0, "sidebarType": "note|definition|deeper|historical", "title": "Title", "text": "Content..." }

GUIDELINES:
- Keep paragraphs SHORT (3-4 sentences max)
- Use sidebars for technical details that might overwhelm casual readers
- Preserve specific numbers and values from annotations
- Don't repeat information already in the text

Return ONLY a JSON array, no explanation.`

          const response = await callAI(
            'You are an expert editor who makes precise, surgical improvements to educational content.',
            editPrompt
          )
          
          // Parse edits
          let edits
          try {
            let jsonStr = response.trim()
            if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.slice(7)
            if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.slice(3)
            if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3)
            edits = JSON.parse(jsonStr.trim())
          } catch (e) {
            console.log(`  ❌ Failed to parse edits: ${e.message}`)
            continue
          }
          
          console.log(`  📋 Got ${edits.length} edits`)
          
          // Apply edits to the section in updatedContent
          // We need to be careful about indices as we insert
          const sectionNode = getAtPath(updatedContent.content, sectionPath)
          if (!sectionNode || !sectionNode.children) continue
          
          // Sort edits by paragraph index (descending) so inserts don't mess up indices
          const insertEdits = edits.filter(e => e.type === 'insert_paragraph' || e.type === 'sidebar')
          const expandEdits = edits.filter(e => e.type === 'expand')
          
          // Apply expand edits first (they don't change indices)
          for (const edit of expandEdits) {
            // Find the actual child index for this paragraph
            let pCount = 0
            for (let i = 0; i < sectionNode.children.length; i++) {
              if (sectionNode.children[i].type === 'p') {
                if (pCount === edit.paragraphIndex) {
                  // Found it - expand
                  const pNode = sectionNode.children[i]
                  if (typeof pNode.children === 'string') {
                    pNode.children = pNode.children + ' ' + edit.addSentences
                  } else if (Array.isArray(pNode.children)) {
                    pNode.children.push(' ' + edit.addSentences)
                  }
                  console.log(`    ✅ Expanded paragraph ${edit.paragraphIndex}`)
                  totalEdits++
                  break
                }
                pCount++
              }
            }
          }
          
          // Apply insert edits (sorted by index descending)
          insertEdits.sort((a, b) => (b.afterIndex || 0) - (a.afterIndex || 0))
          
          for (const edit of insertEdits) {
            // Find where to insert (after which paragraph)
            let pCount = 0
            let insertAt = -1
            for (let i = 0; i < sectionNode.children.length; i++) {
              if (sectionNode.children[i].type === 'p') {
                if (pCount === edit.afterIndex) {
                  insertAt = i + 1
                  break
                }
                pCount++
              }
            }
            
            if (insertAt === -1) insertAt = sectionNode.children.length
            
            if (edit.type === 'insert_paragraph') {
              sectionNode.children.splice(insertAt, 0, {
                type: 'p',
                children: edit.text
              })
              console.log(`    ✅ Inserted paragraph after index ${edit.afterIndex}`)
              totalEdits++
            } else if (edit.type === 'sidebar') {
              sectionNode.children.splice(insertAt, 0, {
                type: 'Sidebar',
                props: {
                  type: edit.sidebarType || 'note',
                  title: edit.title
                },
                children: edit.text
              })
              console.log(`    ✅ Added sidebar: "${edit.title}"`)
              totalEdits++
            }
          }
          
        } catch (e) {
          console.error(`  ❌ Failed to process section: ${e.message}`)
        }
      }
      
      const message = newSectionsCreated > 0
        ? `Created ${newSectionsCreated} new section(s) + applied ${totalEdits - newSectionsCreated} edits`
        : `Applied ${totalEdits} edits across ${sectionAnnotations.size} section(s)`
      
      if (totalEdits > 0) {
        // Create a version snapshot before saving
        try {
          await createVersion(jsonPath, `Before regroup: ${totalEdits} edits`, 'regroup')
          console.log('📸 Version snapshot created')
        } catch (versionErr) {
          console.warn('⚠️ Could not create version:', versionErr.message)
        }
        
        // Save the updated content
        await fs.writeFile(jsonPath, JSON.stringify(updatedContent, null, 2))
        console.log(`\n💾 Saved: ${jsonPath}`)
        
        // Commit to git (for undo capability)
        const commitMsg = newSectionsCreated > 0
          ? `[regroup] +${newSectionsCreated} sections, ${totalEdits - newSectionsCreated} edits in ${tutorialId}`
          : `[regroup] ${totalEdits} edits in ${tutorialId}`
        commitAndPush(jsonPath, commitMsg).catch(() => {})
      }
      
      return sendJson(res, 200, {
        success: true,
        preview: false,
        tutorialId,
        editsApplied: totalEdits,
        newSectionsCreated,
        sectionsProcessed: sectionAnnotations.size,
        message,
        updatedContent
      })
      
    } catch (error) {
      console.error('❌ Regroup error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Undo endpoint - reverts to previous git commit
  if (url.pathname === '/undo' && req.method === 'POST') {
  }
  
  // Undo endpoint - reverts to previous git commit
  if (url.pathname === '/undo' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId } = body
      
      console.log('\n⏪ Undo Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      
      if (!tutorialId) {
        return sendJson(res, 400, { error: 'Missing tutorialId' })
      }
      
      const jsonFilenames = {
        'matrix-from-vectors-engine': 'matrix-from-vectors',
        'matrix-discovery-engine': 'matrix-discovery',
        'lead-lag-correlation-engine': 'lead-lag-correlation',
        'least-squares-engine': 'least-squares'
      }
      
      const filename = jsonFilenames[tutorialId] || tutorialId
      const jsonPath = path.join(CONTENT_DIR, `${filename}.json`)
      const relativePath = `src/content/${filename}.json`
      
      try {
        // Revert to previous commit for this file
        execSync(`git checkout HEAD~1 -- "${relativePath}"`, { 
          cwd: TUTORIALS_REPO,
          stdio: 'pipe'
        })
        
        // Read the reverted content
        const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
        
        // Commit the revert
        execSync(`git add "${relativePath}" && git commit -m "[undo] Reverted ${tutorialId}"`, {
          cwd: TUTORIALS_REPO,
          stdio: 'pipe'
        })
        
        console.log('✅ Reverted to previous version')
        
        return sendJson(res, 200, {
          success: true,
          message: 'Reverted to previous version',
          updatedContent: content
        })
      } catch (e) {
        console.error('Undo failed:', e.message)
        return sendJson(res, 500, { error: 'No previous version to undo to' })
      }
      
    } catch (error) {
      console.error('❌ Undo error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== COMBINE NODES ====================
  if (url.pathname === '/combine' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, nodeIds, editorNote } = body
      
      console.log('\n🔗 Combine Nodes Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Nodes: ${nodeIds?.join(', ')}`)
      console.log(`  Editor note: ${editorNote || '(none)'}`)
      
      if (!tutorialId || !nodeIds || nodeIds.length < 2) {
        return sendJson(res, 400, { error: 'tutorialId and at least 2 nodeIds required' })
      }
      
      // Load tutorial
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      
      // Find the nodes to combine
      // We need to replicate the tree ID generation logic to find nodes
      const NOTABLE_TYPES = ['Sidebar', 'DeepDive', 'Callout', 'Example', 'ComparisonTable', 'InteractiveViz', 'Diagram', 'CodeBlock', 'Quiz', 'Footnote']
      
      // Build a map of tree-generated IDs to actual nodes with parent info
      const nodeMap = new Map()
      
      function mapNotableElements(children, parentId, parentNode, indexOffset = 0) {
        if (!children) return
        const arr = Array.isArray(children) ? children : [children]
        
        arr.forEach((child, idx) => {
          if (!child || typeof child !== 'object') return
          
          if (NOTABLE_TYPES.includes(child.type)) {
            const nodeId = `${parentId}-${child.type.toLowerCase()}-${indexOffset + idx}`
            nodeMap.set(nodeId, { node: child, parent: parentNode, index: idx })
          }
          
          if (child.children) {
            mapNotableElements(child.children, parentId, child, indexOffset + idx * 100)
          }
        })
      }
      
      // Process sections like the tree generator does
      const contentChildren = content.content.children
      if (contentChildren) {
        let sectionIdx = 0
        contentChildren.forEach((section, secArrayIdx) => {
          if (section.type !== 'Section') return
          
          const sectionId = `section-${sectionIdx}`
          nodeMap.set(sectionId, { node: section, parent: content.content, index: secArrayIdx })
          
          if (section.children) {
            const sectionChildren = Array.isArray(section.children) ? section.children : [section.children]
            let subIdx = 0
            let currentSubId = null
            let currentSubContent = []
            
            sectionChildren.forEach((child, childIdx) => {
              if (child.type === 'h3' || child.type === 'h4') {
                // Process previous subsection's notable elements
                if (currentSubId && currentSubContent.length > 0) {
                  mapNotableElements(currentSubContent, currentSubId, section)
                }
                currentSubId = `${sectionId}-sub-${subIdx}`
                currentSubContent = []
                subIdx++
              } else if (currentSubId) {
                currentSubContent.push(child)
                // Also check if this child itself is notable
                if (NOTABLE_TYPES.includes(child.type)) {
                  const nodeId = `${currentSubId}-${child.type.toLowerCase()}-${childIdx}`
                  nodeMap.set(nodeId, { node: child, parent: section, index: childIdx })
                }
              } else {
                // Notable at section level (before first h3)
                if (NOTABLE_TYPES.includes(child.type)) {
                  const nodeId = `${sectionId}-${child.type.toLowerCase()}-${childIdx}`
                  nodeMap.set(nodeId, { node: child, parent: section, index: childIdx })
                }
              }
            })
            
            // Don't forget last subsection
            if (currentSubId && currentSubContent.length > 0) {
              mapNotableElements(currentSubContent, currentSubId, section)
            }
          }
          sectionIdx++
        })
      }
      
      console.log(`  Built node map with ${nodeMap.size} entries`)
      
      const nodesToCombine = []
      const nodeContents = []
      
      // Collect nodes to combine using the map
      for (const nodeId of nodeIds) {
        const found = nodeMap.get(nodeId)
        if (found) {
          nodesToCombine.push(found)
          nodeContents.push({
            id: nodeId,
            title: found.node.props?.title || found.node.type || 'Untitled',
            content: JSON.stringify(found.node, null, 2).slice(0, 2000)
          })
          console.log(`  ✅ Found node: ${nodeId}`)
        } else {
          console.log(`  ⚠️ Node not found: ${nodeId}`)
        }
      }
      
      if (nodesToCombine.length < 2) {
        return sendJson(res, 400, { error: 'Could not find at least 2 nodes to combine' })
      }
      
      console.log(`  Found ${nodesToCombine.length} nodes to combine`)
      
      // Call AI to combine the content
      const combinePrompt = `You are combining multiple sections of an educational tutorial into one cohesive section.

NODES TO COMBINE:
${nodeContents.map((n, i) => `
--- Node ${i + 1}: ${n.title} ---
${n.content}
`).join('\n')}

${editorNote ? `EDITOR'S GUIDANCE:
${editorNote}
` : ''}

Create a SINGLE combined section that:
1. Merges the content coherently (no duplication)
2. Preserves the key insights from each source
3. Maintains educational flow and clarity
4. Keeps any important examples or analogies${editorNote ? '\n5. Follows the editor\'s guidance above' : ''}

Return ONLY valid JSON for a Section element with this structure:
{
  "type": "Section",
  "props": { "title": "Combined section title" },
  "children": [
    // paragraphs, callouts, etc.
  ]
}

Return ONLY the JSON, no markdown or explanation.`

      console.log('🤖 Calling AI to combine nodes...')
      const aiResponse = await callAI(
        'You are an expert at restructuring educational content. Return only valid JSON.',
        combinePrompt
      )
      
      // Parse AI response
      let combinedSection
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found in response')
        combinedSection = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('❌ Failed to parse AI response:', e.message)
        return sendJson(res, 500, { error: 'AI returned invalid JSON' })
      }
      
      // Save backup
      const backup = JSON.stringify(content, null, 2)
      await fs.writeFile(jsonPath + '.backup', backup)
      
      // Remove nodes from their parents (in reverse index order to avoid shifts)
      // Group by parent and sort indices descending
      const byParent = new Map()
      nodesToCombine.forEach(info => {
        const parentKey = info.parent
        if (!byParent.has(parentKey)) byParent.set(parentKey, [])
        byParent.get(parentKey).push(info)
      })
      
      let firstNode = nodesToCombine[0]
      let removedCount = 0
      
      for (const [parent, nodes] of byParent) {
        // Sort by index descending to remove from end first
        nodes.sort((a, b) => b.index - a.index)
        
        for (const nodeInfo of nodes) {
          if (nodeInfo === firstNode) continue // Keep first node for replacement
          
          if (parent.children && Array.isArray(parent.children)) {
            parent.children.splice(nodeInfo.index, 1)
            removedCount++
            console.log(`  🗑️ Removed node at index ${nodeInfo.index}`)
          }
        }
      }
      
      // Replace the first node with combined content
      if (firstNode.parent?.children && Array.isArray(firstNode.parent.children)) {
        // Find current index (may have shifted)
        const currentIdx = firstNode.parent.children.indexOf(firstNode.node)
        if (currentIdx !== -1) {
          firstNode.parent.children[currentIdx] = combinedSection
          console.log(`  ✅ Replaced node at index ${currentIdx} with combined section`)
        }
      }
      
      // Save
      await fs.writeFile(jsonPath, JSON.stringify(content, null, 2))
      console.log('💾 Saved combined content')
      
      // Git commit
      try {
        execSync(`git add "${jsonPath}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
        execSync(`git commit -m "[combine] ${nodeIds.length} nodes in ${tutorialId}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
        console.log('✅ Git commit: combine nodes')
      } catch (e) {
        console.log('⚠️ Git commit skipped:', e.message)
      }
      
      return sendJson(res, 200, { 
        success: true, 
        combinedTitle: combinedSection.props?.title,
        message: `Combined ${nodesToCombine.length} nodes`
      })
      
    } catch (error) {
      console.error('❌ Combine error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== NATURAL LANGUAGE TREE COMMAND ====================
  if (url.pathname === '/nl-tree-command' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { command, nodes } = body
      
      console.log('\n✨ Natural Language Tree Command:')
      console.log(`  Command: "${command}"`)
      console.log(`  Available nodes: ${nodes?.length}`)
      
      if (!command || !nodes) {
        return sendJson(res, 400, { error: 'command and nodes required' })
      }
      
      // Build node list for AI
      const nodeList = nodes.map(n => `- ${n.id}: "${n.title}"${n.excerpt ? ` (${n.excerpt})` : ''}`).join('\n')
      
      const nlPrompt = `You are helping a user navigate and manipulate a tree-structured tutorial document.

USER COMMAND: "${command}"

AVAILABLE NODES:
${nodeList}

Interpret the user's command and return a JSON response:

1. If they want to SELECT nodes (e.g., "select all nodes about X", "find nodes mentioning Y"):
   Return: { "action": "select", "nodeIds": ["id1", "id2", ...], "reasoning": "why these nodes" }

2. If they want to COMBINE nodes (e.g., "combine sections on X", "merge the Y nodes"):
   Return: { "action": "combine", "nodeIds": ["id1", "id2", ...], "editorNote": "suggested guidance for combination", "reasoning": "why these nodes" }

3. If they want to PROMOTE nodes (e.g., "promote children of X to sections", "make X's subsections into top-level sections"):
   Return: { "action": "promote", "parentNodeId": "id of parent", "reasoning": "explanation" }

4. If they want to SPLIT a large section (e.g., "split X into separate sections", "break up the Y section"):
   Return: { "action": "split", "nodeId": "id of node to split", "reasoning": "explanation" }

5. If they want to DELETE nodes:
   Return: { "action": "delete", "nodeIds": ["id1", "id2", ...], "reasoning": "why" }

6. If they want to MOVE nodes (e.g., "move X under Y", "reorder X before Y"):
   Return: { "action": "move", "nodeIds": ["id1"], "targetId": "destination parent id", "position": "before|after|inside", "reasoning": "explanation" }

7. If they want to LINT/REORGANIZE the structure (e.g., "lint the structure", "reorganize large sections", "fix structural issues", "clean up the tree"):
   Return: { "action": "lint", "autoFix": true, "reasoning": "explanation" }

8. If no nodes match or command is unclear:
   Return: { "action": "none", "message": "explanation to user" }

Consider synonyms and related terms (e.g., "pacemaker cells" relates to "interneurons", "rhythm generators").
Select nodes whose titles OR excerpts relate to the topic.
Return ONLY valid JSON.`

      console.log('🤖 Calling AI to interpret command...')
      const aiResponse = await callAI(
        'You interpret natural language commands for tree manipulation. Return only valid JSON.',
        nlPrompt
      )
      
      // Parse AI response
      let result
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found')
        result = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('❌ Failed to parse AI response:', e.message)
        return sendJson(res, 200, { action: 'none', message: 'Could not interpret command' })
      }
      
      console.log(`  Result: ${result.action} - ${result.nodeIds?.length || 0} nodes`)
      if (result.reasoning) console.log(`  Reasoning: ${result.reasoning}`)
      
      return sendJson(res, 200, result)
      
    } catch (error) {
      console.error('❌ NL command error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== GENERATE PRESENTATION ====================
  if (url.pathname === '/generate-presentation' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { nodeContent, nodeTitle, tutorialId, nodeId } = body
      
      console.log('\n🎬 Generate Presentation Request:')
      console.log(`  Node: ${nodeTitle}`)
      
      // Check cache first
      const cacheDir = path.join(CONTENT_DIR, '.presentations')
      const cacheKey = `${tutorialId || 'unknown'}-${nodeId || nodeTitle}`.replace(/[^a-z0-9-]/gi, '_')
      const cachePath = path.join(cacheDir, `${cacheKey}.json`)
      
      try {
        await fs.mkdir(cacheDir, { recursive: true })
        const cached = await fs.readFile(cachePath, 'utf-8')
        console.log('  ✅ Using cached presentation')
        return sendJson(res, 200, JSON.parse(cached))
      } catch {
        // Not cached, generate new
      }
      
      const contentStr = typeof nodeContent === 'string' 
        ? nodeContent 
        : JSON.stringify(nodeContent, null, 2)
      
      const prompt = `Create an animated educational presentation for this content. Your job is NOT to just reformat the text - you must EXPAND and CLARIFY it for someone watching a video.

TITLE: ${nodeTitle}

SOURCE CONTENT:
${contentStr.slice(0, 3000)}

Generate a JSON array of 5-8 slides. Make it like Schoolhouse Rock - vivid, memorable, with concrete analogies.

CRITICAL INSTRUCTIONS:
1. DON'T just copy text from the source - EXPLAIN it more clearly
2. Use concrete analogies and metaphors (e.g., "neurons are like musicians in an orchestra")
3. Break down any abstract concepts into visual/tangible examples
4. The narration should be conversational, like a friendly teacher explaining to a curious student
5. Each slide should make ONE clear point with vivid imagery

Slide types and schemas:
- "title": { title, subtitle } - Opening hook
- "bullets": { heading, points: string[] } - Key points (max 4 bullets, each should be a complete thought)
- "concept": { emoji, concept, explanation } - One big idea with simple explanation
- "analogy": { left, leftEmoji, right, rightEmoji } - "X is like Y" comparison
- "summary": { takeaway } - One memorable sentence to remember

Each slide needs:
- type: one of the above
- content: matching schema
- narration: 2-3 sentences, CONVERSATIONAL tone, ~10-15 seconds when spoken
- duration: 8000-15000 (milliseconds - give time for narration!)

Example of GOOD vs BAD:
BAD narration: "Theta oscillations occur at 4-8 Hz in the hippocampus."
GOOD narration: "Imagine your brain has a metronome clicking 4 to 8 times per second. That's theta - the rhythm your hippocampus uses to organize memories, like a librarian sorting books into the right shelves."

Return ONLY valid JSON array.`

      console.log('🤖 Generating presentation script...')
      const aiResponse = await callAI(
        'You create vivid, memorable educational presentations like Schoolhouse Rock. Expand and clarify concepts, dont just reformat. Return only valid JSON array.',
        prompt
      )
      
      let script
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('No JSON array found')
        script = JSON.parse(jsonMatch[0])
        
        // Ensure minimum durations based on narration length
        script = script.map(slide => ({
          ...slide,
          duration: Math.max(slide.duration || 8000, (slide.narration?.length || 0) * 80) // ~80ms per char for speech
        }))
        
      } catch (e) {
        console.error('❌ Failed to parse script:', e.message)
        script = [
          { type: 'title', content: { title: nodeTitle }, narration: `Let's learn about ${nodeTitle}`, duration: 4000 },
          { type: 'concept', content: { concept: 'Error', explanation: 'Presentation generation failed.' }, narration: 'Sorry, something went wrong generating this presentation.', duration: 5000 }
        ]
      }
      
      console.log(`  Generated ${script.length} slides`)
      
      // Generate audio with AWS Polly
      let audioUrls = []
      try {
        console.log('  🔊 Generating Polly audio...')
        audioUrls = await generatePresentationAudio(script, cacheKey)
        console.log(`  ✅ Generated ${audioUrls.filter(Boolean).length} audio files`)
      } catch (e) {
        console.log('  ⚠️ Polly audio failed, will use browser TTS:', e.message)
      }
      
      // Attach audio URLs to script
      script = script.map((slide, i) => ({
        ...slide,
        audioUrl: audioUrls[i] || null
      }))
      
      // Cache the result
      const result = { script, generatedAt: new Date().toISOString() }
      try {
        await fs.writeFile(cachePath, JSON.stringify(result, null, 2))
        console.log('  💾 Cached presentation')
      } catch (e) {
        console.log('  ⚠️ Failed to cache:', e.message)
      }
      
      return sendJson(res, 200, result)
      
    } catch (error) {
      console.error('❌ Generate presentation error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== STRUCTURE LINT (analyze and suggest splits) ====================
  if (url.pathname === '/structure-lint' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, autoFix = false } = body
      
      console.log('\n🔍 Structure Lint Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Auto-fix: ${autoFix}`)
      
      // Load tutorial
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      
      // Thresholds for "too large"
      const MAX_DIRECT_CHILDREN = 8
      const MAX_TEXT_LENGTH = 2000 // chars
      
      // Analyze structure
      const issues = []
      
      function analyzeNode(node, path = '', depth = 0) {
        if (!node || typeof node !== 'object') return
        
        const children = Array.isArray(node.children) ? node.children : (node.children ? [node.children] : [])
        const nodeTitle = node.props?.title || node.type || 'unnamed'
        
        // Count direct element children (not strings)
        const elementChildren = children.filter(c => typeof c === 'object' && c !== null)
        
        // Estimate text length
        let textLength = 0
        function countText(n) {
          if (typeof n === 'string') textLength += n.length
          if (n?.children) {
            const arr = Array.isArray(n.children) ? n.children : [n.children]
            arr.forEach(countText)
          }
        }
        countText(node)
        
        // Check for issues
        if (node.type === 'Section' || path.includes('sub')) {
          if (elementChildren.length > MAX_DIRECT_CHILDREN) {
            issues.push({
              type: 'too_many_children',
              path,
              title: nodeTitle,
              childCount: elementChildren.length,
              suggestion: `Split into ${Math.ceil(elementChildren.length / 5)} subsections`
            })
          }
          
          if (textLength > MAX_TEXT_LENGTH && elementChildren.length <= 2) {
            issues.push({
              type: 'text_too_long',
              path,
              title: nodeTitle,
              textLength,
              suggestion: `Break into smaller paragraphs or add subsection headers`
            })
          }
        }
        
        // Recurse
        elementChildren.forEach((child, i) => {
          analyzeNode(child, path ? `${path}.children[${i}]` : `children[${i}]`, depth + 1)
        })
      }
      
      analyzeNode(content.content)
      
      console.log(`  Found ${issues.length} structural issues`)
      
      if (issues.length === 0) {
        return sendJson(res, 200, { 
          status: 'clean',
          message: 'No structural issues found',
          issues: []
        })
      }
      
      if (!autoFix) {
        // Just return the analysis
        return sendJson(res, 200, {
          status: 'issues_found',
          message: `Found ${issues.length} structural issues`,
          issues
        })
      }
      
      // Auto-fix: Ask AI to reorganize each problematic section
      console.log('🤖 Auto-fixing structural issues...')
      
      // Save backup
      await fs.writeFile(jsonPath + '.backup', JSON.stringify(content, null, 2))
      
      let fixedCount = 0
      for (const issue of issues) {
        if (issue.type !== 'too_many_children') continue
        
        // Find the node
        const pathParts = issue.path.split('.').filter(p => p)
        let targetNode = content.content
        let parentNode = null
        let targetIndex = -1
        
        for (const part of pathParts) {
          const match = part.match(/children\[(\d+)\]/)
          if (match) {
            parentNode = targetNode
            targetIndex = parseInt(match[1])
            targetNode = Array.isArray(targetNode.children) 
              ? targetNode.children[targetIndex]
              : targetNode.children
          }
        }
        
        if (!targetNode) continue
        
        const children = Array.isArray(targetNode.children) ? targetNode.children : [targetNode.children]
        
        // Ask AI how to group these children
        const childSummary = children.map((c, i) => {
          const type = c?.type || 'text'
          const title = c?.props?.title || (typeof c === 'string' ? c.slice(0, 50) : '')
          return `${i}: [${type}] ${title}`
        }).join('\n')
        
        const groupPrompt = `Analyze these ${children.length} elements from a tutorial section and group them into 3-6 logical subsections.

SECTION: "${issue.title}"

CHILDREN:
${childSummary}

Return a JSON array where each item is a subsection:
[
  { "title": "Subsection Title", "childIndices": [0, 1, 2], "summary": "What this subsection covers" },
  ...
]

Group by semantic similarity and logical flow. Each subsection should have 3-8 items.
Return ONLY valid JSON array.`

        try {
          const aiResponse = await callAI(
            'You organize educational content into logical sections. Return only valid JSON.',
            groupPrompt
          )
          
          const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
          if (!jsonMatch) continue
          
          const groupings = JSON.parse(jsonMatch[0])
          
          // Restructure the children based on groupings
          const newChildren = []
          
          for (const group of groupings) {
            if (!group.childIndices || group.childIndices.length === 0) continue
            
            // Create h3 header for this group
            newChildren.push({
              type: 'h3',
              children: group.title
            })
            
            // Add the grouped children
            for (const idx of group.childIndices) {
              if (children[idx]) {
                newChildren.push(children[idx])
              }
            }
          }
          
          // Replace the children
          targetNode.children = newChildren
          fixedCount++
          console.log(`  ✅ Reorganized "${issue.title}" into ${groupings.length} subsections`)
          
        } catch (e) {
          console.log(`  ⚠️ Failed to fix "${issue.title}": ${e.message}`)
        }
      }
      
      if (fixedCount > 0) {
        // Clean up empty h3s (headers with no following content)
        console.log('🧹 Cleaning up empty subsection headers...')
        let emptyH3sRemoved = 0
        
        const allSections = content.content.children.filter(c => c.type === 'Section')
        allSections.forEach(section => {
          if (!section.children) return
          const children = Array.isArray(section.children) ? section.children : [section.children]
          
          const newChildren = []
          for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.type === 'h3') {
              const next = children[i + 1]
              if (!next || next.type === 'h3') {
                emptyH3sRemoved++
                continue // Skip empty h3
              }
            }
            newChildren.push(child)
          }
          section.children = newChildren
        })
        
        if (emptyH3sRemoved > 0) {
          console.log(`  🗑️ Removed ${emptyH3sRemoved} empty h3 headers`)
        }
        
        // Save
        await fs.writeFile(jsonPath, JSON.stringify(content, null, 2))
        console.log('💾 Saved restructured content')
        
        // Git commit
        try {
          execSync(`git add "${jsonPath}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
          execSync(`git commit -m "[lint-fix] Reorganized ${fixedCount} sections in ${tutorialId}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
          console.log('✅ Git commit: lint-fix')
        } catch (e) {
          console.log('⚠️ Git commit skipped')
        }
      }
      
      return sendJson(res, 200, {
        status: 'fixed',
        message: `Fixed ${fixedCount} of ${issues.length} issues`,
        fixedCount,
        issues
      })
      
    } catch (error) {
      console.error('❌ Structure lint error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== SEMANTIC TREE GENERATION ====================
  if (url.pathname === '/generate-semantic-tree' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, forceRegenerate = false } = body
      
      console.log('\n🌳 Semantic Tree Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      
      // Check cache
      const cachePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
      
      if (!forceRegenerate) {
        try {
          const cached = await fs.readFile(cachePath, 'utf-8')
          console.log('  ✅ Using cached semantic tree')
          return sendJson(res, 200, JSON.parse(cached))
        } catch {
          // Not cached
        }
      }
      
      // Load tutorial
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const tutorial = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      
      // Generate semantic tree
      const tree = await generateFullSemanticTree(tutorial)
      
      // Cache result
      const result = { tree, generatedAt: new Date().toISOString(), tutorialId }
      await fs.writeFile(cachePath, JSON.stringify(result, null, 2))
      console.log('  💾 Cached semantic tree')
      
      return sendJson(res, 200, result)
      
    } catch (error) {
      console.error('❌ Semantic tree error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== EXPLAIN SELECTED TEXT ====================
  if (url.pathname === '/explain-selection' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, parentNodeId, parentNode, selectedText, question, mode = 'faithful' } = body
      
      console.log('\n💡 Explain Selection Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Parent: ${parentNode?.title}`)
      console.log(`  Selected: "${selectedText}"`)
      console.log(`  Question: ${question || '(none)'}`)
      console.log(`  Mode: ${mode}`)
      
      // Different prompts for explain vs ask
      const isQuestion = !!question
      
      // Generate explanation as child node(s)
      const explainPrompt = mode === 'faithful'
        ? `You are ${isQuestion ? 'answering a question' : 'explaining a term/phrase'} for a reader of educational content.

${isQuestion ? `QUESTION: ${question}` : `SELECTED TEXT: "${selectedText}"`}
${isQuestion && selectedText ? `REGARDING: "${selectedText}"` : ''}

CONTEXT (from the source):
${parentNode.sourceText || parentNode.summary}

${isQuestion 
  ? 'Answer the question using ONLY information from or directly implied by the context above.'
  : `Explain what "${selectedText}" means IN THE CONTEXT of this source material.`}
- Only use information from or directly implied by the context
- If the context doesn't ${isQuestion ? 'answer this' : 'explain this term'}, say so
- Be educational and clear

Return a JSON object with:
- "title": ${isQuestion ? 'A clear title summarizing the Q&A' : 'A clear title for this explanation (e.g., "What are GABAergic interneurons?")'}
- "summary": 2-4 sentence ${isQuestion ? 'answer' : 'explanation'} based on the source context
- "needsMoreDetail": true if this ${isQuestion ? 'answer' : 'concept'} could be further broken down

Return ONLY valid JSON.`
        : `You are ${isQuestion ? 'answering a question' : 'explaining a term/phrase'} for a reader.

${isQuestion ? `QUESTION: ${question}` : `SELECTED TEXT: "${selectedText}"`}
${isQuestion && selectedText ? `REGARDING: "${selectedText}"` : ''}

CONTEXT (from the source):
${parentNode.sourceText || parentNode.summary}

${isQuestion 
  ? 'Answer the question thoroughly using your full knowledge. The source context above gives you the topic area, but you should draw on general knowledge to give a COMPLETE, HELPFUL answer. Do NOT say "the source doesn\'t mention this" — instead, answer the question directly using what you know.'
  : `Explain what "${selectedText}" means thoroughly. Use the source context for topic grounding, but draw on your full knowledge to give a complete explanation.`}

Return a JSON object with:
- "title": ${isQuestion ? 'A clear title summarizing the Q&A' : 'A clear title for this explanation'}
- "summary": 2-4 sentence educational ${isQuestion ? 'answer' : 'explanation'} that DIRECTLY ${isQuestion ? 'answers the question' : 'explains the concept'}
- "isExternal": true if you added information beyond what the source says
- "needsMoreDetail": true if this ${isQuestion ? 'answer' : 'concept'} could be further broken down

Return ONLY valid JSON.`
      
      const response = await callAI(
        mode === 'faithful'
          ? 'You explain terms based only on provided context. Return valid JSON.'
          : 'You explain terms educationally, clearly marking external knowledge. Return valid JSON.',
        explainPrompt
      )
      
      let explanation
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found')
        explanation = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('  ❌ Failed to parse explanation:', e.message)
        return sendJson(res, 500, { error: 'Failed to generate explanation' })
      }
      
      // Create the child node
      const childNode = {
        id: `${parentNodeId}-${isQuestion ? 'qa' : 'explain'}-${Date.now()}`,
        title: explanation.title,
        summary: explanation.summary,
        sourceText: selectedText,
        question: question || null,  // Store the original question if it was a Q&A
        isLeaf: true,
        canExpand: explanation.needsMoreDetail || false,
        expanded: false,
        isAtomic: false,
        isExternal: explanation.isExternal || false,
        isExplanation: !isQuestion,  // Mark as user-requested explanation
        isQA: isQuestion,            // Mark as Q&A
        generatedAt: new Date().toISOString()
      }
      
      // Add to cached tree
      const cachePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
      try {
        const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'))
        
        // Find parent and add child
        const addChild = (n) => {
          if (n.id === parentNodeId) {
            if (!n.children) n.children = []
            n.children.push(childNode)
            n.isLeaf = false
            return true
          }
          if (n.children) {
            for (const child of n.children) {
              if (addChild(child)) return true
            }
          }
          return false
        }
        
        if (addChild(cached.tree)) {
          cached.lastExplained = new Date().toISOString()
          await fs.writeFile(cachePath, JSON.stringify(cached, null, 2))
          console.log('  💾 Added explanation child node')
        }
      } catch (e) {
        console.log('  ⚠️ Could not update cache:', e.message)
      }
      
      return sendJson(res, 200, { child: childNode })
      
    } catch (error) {
      console.error('❌ Explain selection error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== EXPAND SEMANTIC NODE ====================
  if (url.pathname === '/expand-semantic-node' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, nodeId, node, parentContext, mode = 'faithful' } = body
      
      console.log('\n🔍 Expand Node Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Node: ${node?.title || nodeId}`)
      console.log(`  Mode: ${mode}`)
      
      // Expand the node
      const result = await expandNode(node, parentContext, mode)
      
      if (!result.atomic) {
        // Update the cached tree with new children AND bubble up enriched summaries
        const cachePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
        try {
          const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'))
          
          // Find and update the node, tracking the path for bubble-up
          const updateNode = (n, ancestors = []) => {
            if (n.id === nodeId) {
              // Update this node
              n.children = result.children
              n.expanded = true
              n.expandedAt = new Date().toISOString()
              n.isLeaf = false
              
              // Apply enriched summary if provided
              if (result.enrichedParentSummary) {
                console.log('  📝 Updating parent summary')
                n.originalSummary = n.originalSummary || n.summary  // Preserve original
                n.summary = result.enrichedParentSummary
              }
              
              return { found: true, ancestors }
            }
            if (n.children) {
              for (const child of n.children) {
                const res = updateNode(child, [...ancestors, n])
                if (res.found) return res
              }
            }
            return { found: false }
          }
          
          const updateResult = updateNode(cached.tree)
          
          if (updateResult.found) {
            // Bubble up: update ancestor summaries to reflect new content
            if (result.enrichedParentSummary && updateResult.ancestors.length > 0) {
              console.log(`  🫧 Bubbling up through ${updateResult.ancestors.length} ancestors...`)
              
              // For each ancestor (from immediate parent up to root)
              for (let i = updateResult.ancestors.length - 1; i >= 0; i--) {
                const ancestor = updateResult.ancestors[i]
                
                // Collect all child summaries
                const childSummaries = ancestor.children
                  .map(c => `${c.title}: ${c.summary.slice(0, 100)}...`)
                  .join('; ')
                
                // Mark that this ancestor has been enriched by expansion
                ancestor.enrichedFromExpansion = true
                ancestor.lastEnrichedAt = new Date().toISOString()
                
                // Note: We could regenerate ancestor summaries here too,
                // but that's expensive. For now, just mark them as potentially stale.
                // A separate "recompute summaries" job could refresh them.
              }
            }
            
            cached.lastExpanded = new Date().toISOString()
            await fs.writeFile(cachePath, JSON.stringify(cached, null, 2))
            console.log('  💾 Updated cached tree with enriched summaries')
          }
        } catch (e) {
          console.log('  ⚠️ Could not update cache:', e.message)
        }
      }
      
      return sendJson(res, 200, result)
      
    } catch (error) {
      console.error('❌ Expand node error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== COMPUTE EMBEDDINGS ====================
  if (url.pathname === '/compute-embeddings' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId } = body
      
      console.log('\n🧮 Compute Embeddings Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      
      const cachePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'))
      
      // Compute embeddings
      await computeTreeEmbeddings(cached.tree)
      
      // Save updated tree
      cached.embeddingsComputedAt = new Date().toISOString()
      await fs.writeFile(cachePath, JSON.stringify(cached, null, 2))
      
      // Count embeddings
      let embeddingCount = 0
      const countEmbeddings = (n) => {
        if (n.embedding) embeddingCount++
        if (n.children) n.children.forEach(countEmbeddings)
      }
      countEmbeddings(cached.tree)
      
      return sendJson(res, 200, { 
        status: 'ok', 
        embeddingCount,
        embeddingsComputedAt: cached.embeddingsComputedAt
      })
      
    } catch (error) {
      console.error('❌ Compute embeddings error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== SEMANTIC SEARCH ====================
  if (url.pathname === '/semantic-search' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, query, maxResults = 5 } = body
      
      console.log('\n🔍 Semantic Search:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Query: ${query}`)
      
      // Load tree
      const cachePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'))
      
      // Generate query embedding
      const { generateEmbedding, cosineSimilarity } = await import('./ai-config.js')
      const queryEmbedding = await generateEmbedding(query)
      
      // Search tree hierarchically
      const results = []
      
      function searchNode(node, depth = 0, parentScore = 1.0) {
        if (!node.embedding) return
        
        // Compute similarity to this node's summary
        const summaryScore = cosineSimilarity(queryEmbedding, node.embedding)
        
        // Also check child aggregate if available (backdoor match)
        let childScore = 0
        if (node.childEmbeddingAggregate) {
          childScore = cosineSimilarity(queryEmbedding, node.childEmbeddingAggregate)
        }
        
        const score = Math.max(summaryScore, childScore * 0.9) // Slight penalty for indirect match
        
        results.push({
          id: node.id,
          title: node.title,
          summary: node.summary,
          score,
          summaryScore,
          childScore,
          depth,
          isLeaf: node.isLeaf || !node.children
        })
        
        // Only drill into children if parent seems relevant
        if (score > 0.3 && node.children) {
          for (const child of node.children) {
            searchNode(child, depth + 1, score)
          }
        }
      }
      
      searchNode(cached.tree)
      
      // Sort by score and return top results
      results.sort((a, b) => b.score - a.score)
      const topResults = results.slice(0, maxResults)
      
      console.log(`  Found ${results.length} nodes, returning top ${topResults.length}`)
      
      return sendJson(res, 200, { 
        query,
        results: topResults
      })
      
    } catch (error) {
      console.error('❌ Semantic search error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== RAG QUERY ====================
  if (url.pathname === '/rag/query' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, question, maxContextTokens = 3000 } = body
      
      console.log('\n🤖 RAG Query:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Question: ${question}`)
      
      const result = await ragQuery(tutorialId, question, { maxContextTokens })
      
      return sendJson(res, 200, result)
      
    } catch (error) {
      console.error('❌ RAG query error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== MULTI-HOP RAG ====================
  if (url.pathname === '/rag/multi-hop' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, question, maxHops = 2 } = body
      
      console.log('\n🔄 Multi-hop RAG Query:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Question: ${question}`)
      
      const results = await multiHopQuery(tutorialId, question, maxHops)
      
      return sendJson(res, 200, { hops: results })
      
    } catch (error) {
      console.error('❌ Multi-hop RAG error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== COMPARE RETRIEVAL METHODS ====================
  if (url.pathname === '/rag/compare' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, question } = body
      
      console.log('\n📊 Compare Retrieval:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Question: ${question}`)
      
      const comparison = await compareRetrieval(tutorialId, question)
      
      return sendJson(res, 200, comparison)
      
    } catch (error) {
      console.error('❌ Compare retrieval error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // ==================== STRUCTURE CHANGE (promote, split, etc) ====================
  if (url.pathname === '/structure-change' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, action, parentNodeId, nodeId, reasoning } = body
      
      console.log('\n🔧 Structure Change Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Action: ${action}`)
      console.log(`  Target: ${parentNodeId || nodeId}`)
      
      // Load tutorial
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const content = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
      
      // Save backup
      await fs.writeFile(jsonPath + '.backup', JSON.stringify(content, null, 2))
      
      if (action === 'promote') {
        // Find the parent section and promote its subsections to top-level sections
        // parentNodeId format: "section-N-sub-M" or "section-N"
        
        const sectionMatch = parentNodeId.match(/section-(\d+)/)
        if (!sectionMatch) {
          return sendJson(res, 400, { error: 'Invalid parent node ID' })
        }
        
        const sectionIdx = parseInt(sectionMatch[1])
        const sections = content.content.children.filter(c => c.type === 'Section')
        const targetSection = sections[sectionIdx]
        
        if (!targetSection) {
          return sendJson(res, 400, { error: 'Section not found' })
        }
        
        console.log(`  Found section: ${targetSection.props?.title}`)
        
        // Extract subsections (h3 boundaries) as new sections
        const newSections = []
        let currentSection = null
        let currentChildren = []
        
        const sectionChildren = Array.isArray(targetSection.children) ? targetSection.children : [targetSection.children]
        
        for (const child of sectionChildren) {
          if (child.type === 'h3') {
            // Save previous section
            if (currentSection) {
              newSections.push({
                type: 'Section',
                props: { title: currentSection },
                children: currentChildren
              })
            }
            currentSection = typeof child.children === 'string' ? child.children : 'Subsection'
            currentChildren = []
          } else if (currentSection) {
            currentChildren.push(child)
          } else {
            // Content before first h3 - keep in original section intro
            currentChildren.push(child)
          }
        }
        
        // Don't forget last section
        if (currentSection && currentChildren.length > 0) {
          newSections.push({
            type: 'Section',
            props: { title: currentSection },
            children: currentChildren
          })
        }
        
        console.log(`  Created ${newSections.length} new sections`)
        
        // Find the actual index in content.children (not filtered)
        const actualIdx = content.content.children.findIndex(c => c === targetSection)
        
        // Replace the original section with the new sections
        content.content.children.splice(actualIdx, 1, ...newSections)
        
        // Save
        await fs.writeFile(jsonPath, JSON.stringify(content, null, 2))
        console.log('💾 Saved restructured content')
        
        // Git commit
        try {
          execSync(`git add "${jsonPath}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
          execSync(`git commit -m "[promote] ${parentNodeId} → ${newSections.length} sections in ${tutorialId}"`, { cwd: TUTORIALS_REPO, stdio: 'pipe' })
          console.log('✅ Git commit: promote')
        } catch (e) {
          console.log('⚠️ Git commit skipped')
        }
        
        return sendJson(res, 200, { 
          success: true, 
          message: `Promoted to ${newSections.length} new sections`,
          newSectionCount: newSections.length
        })
        
      } else if (action === 'split') {
        // Similar to promote but for a specific node
        return sendJson(res, 400, { error: 'Split not yet implemented - use promote on the parent section' })
      }
      
      return sendJson(res, 400, { error: `Unknown action: ${action}` })
      
    } catch (error) {
      console.error('❌ Structure change error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  if (url.pathname === '/generate' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { topic } = body
      
      console.log('\n✨ Generate Tutorial Request:')
      console.log(`  Topic: "${topic}"`)
      
      if (!topic || topic.trim().length < 3) {
        return sendJson(res, 400, { error: 'Topic must be at least 3 characters' })
      }
      
      // Generate a URL-safe ID from the topic
      const tutorialId = topic.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      
      // Check if it already exists
      try {
        await fs.access(jsonPath)
        return sendJson(res, 409, { error: `Tutorial "${tutorialId}" already exists` })
      } catch {
        // Good, it doesn't exist
      }
      
      console.log(`🤖 Generating tutorial structure for: "${topic}"`)
      
      const systemPrompt = `You are an expert educator creating interactive tutorials. 
Your tutorials are clear, engaging, and use concrete examples.
You break complex topics into digestible sections with progressive disclosure.`
      
      const generatePrompt = `Create an interactive tutorial about: "${topic}"

Return a JSON object with this exact structure:
{
  "id": "${tutorialId}",
  "title": "Clear, engaging title",
  "subtitle": "One-line description of what users will learn",
  "readTime": "X min",
  "state": {},
  "content": {
    "type": "Fragment",
    "children": [
      // Array of Section objects
    ]
  }
}

Each Section should have:
{
  "type": "Section",
  "props": { "title": "Section Title" },
  "children": [
    // Mix of these element types:
    { "type": "p", "children": "Paragraph text explaining concepts" },
    { "type": "Callout", "props": { "type": "info|tip|warning" }, "children": "Important callout" },
    { "type": "h3", "children": "Subsection heading" },
    { "type": "ul", "children": [{ "type": "li", "children": "Bullet point" }] },
    { "type": "ol", "children": [{ "type": "li", "children": "Numbered item" }] },
    { "type": "Code", "props": { "language": "python|javascript" }, "children": "code here" },
    { "type": "Example", "props": { "title": "Example: ..." }, "children": [...] },
    { "type": "Blockquote", "children": "Key insight or quote" },
    { "type": "DefinitionList", "props": { "items": [{ "term": "Term", "definition": "..." }] } },
    { "type": "ComparisonTable", "props": { "headers": ["A", "B"], "rows": [["x", "y"]] } }
  ]
}

Create 4-6 sections that:
1. Start with "Why This Matters" or motivation
2. Build up concepts progressively
3. Include concrete examples and code where relevant
4. End with "Key Takeaways" or next steps

Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON.`

      const response = await callAI(systemPrompt, generatePrompt)
      
      // Parse the response
      let tutorialContent
      try {
        // Strip markdown code fences if present
        let cleaned = response.trim()
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
        
        // Try direct parse first
        try {
          tutorialContent = JSON.parse(cleaned)
        } catch {
          // Try to extract outermost JSON object
          // Find the first { and match to its closing }
          const startIdx = cleaned.indexOf('{')
          if (startIdx === -1) throw new Error('No JSON object found in response')
          
          let depth = 0
          let endIdx = -1
          for (let i = startIdx; i < cleaned.length; i++) {
            if (cleaned[i] === '{') depth++
            else if (cleaned[i] === '}') {
              depth--
              if (depth === 0) { endIdx = i; break }
            }
          }
          
          if (endIdx === -1) {
            // JSON was truncated — try to repair by closing open structures
            console.warn('⚠️ JSON appears truncated, attempting repair...')
            let partial = cleaned.slice(startIdx)
            // Close any open strings
            const quoteCount = (partial.match(/(?<!\\)"/g) || []).length
            if (quoteCount % 2 !== 0) partial += '"'
            // Close open arrays and objects by counting
            const openBrackets = (partial.match(/\[/g) || []).length - (partial.match(/\]/g) || []).length
            const openBraces = (partial.match(/\{/g) || []).length - (partial.match(/\}/g) || []).length
            for (let i = 0; i < openBrackets; i++) partial += ']'
            for (let i = 0; i < openBraces; i++) partial += '}'
            tutorialContent = JSON.parse(partial)
          } else {
            tutorialContent = JSON.parse(cleaned.slice(startIdx, endIdx + 1))
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError.message)
        console.log('Response preview:', response.slice(0, 500))
        return sendJson(res, 500, { error: 'Failed to parse generated tutorial' })
      }
      
      // Ensure required fields
      tutorialContent.id = tutorialId
      if (!tutorialContent.title) tutorialContent.title = topic
      if (!tutorialContent.state) tutorialContent.state = {}
      
      // Save the file
      await fs.writeFile(jsonPath, JSON.stringify(tutorialContent, null, 2))
      console.log(`💾 Saved: ${jsonPath}`)
      
      // Commit to git
      const commitMsg = `[generate] New tutorial: ${topic.slice(0, 50)}`
      commitAndPush(jsonPath, commitMsg).catch(() => {})
      
      return sendJson(res, 200, {
        success: true,
        tutorialId,
        title: tutorialContent.title,
        message: `Tutorial "${tutorialContent.title}" created successfully`
      })
      
    } catch (error) {
      console.error('❌ Generate error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // ============================================================================
  // ThoughtBlend Endpoints
  // ============================================================================

  // Fetch and extract content from a URL
  if (url.pathname === '/thoughtblend/fetch-url' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { url: targetUrl } = body

      if (!targetUrl) {
        return sendJson(res, 400, { error: 'Missing url' })
      }

      console.log(`\n🔗 Fetching URL: ${targetUrl}`)

      // Fetch the URL content
      const fetchUrl = await import('node:https').then(m => m.default)
      const httpModule = targetUrl.startsWith('https') ? fetchUrl : await import('node:http').then(m => m.default)
      
      const fetchContent = () => new Promise((resolve, reject) => {
        const request = httpModule.get(targetUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0 ThoughtBlend/1.0' }
        }, (response) => {
          // Handle redirects
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log(`  Redirecting to: ${response.headers.location}`)
            return resolve(null) // Would need to follow redirect
          }
          
          let data = ''
          response.on('data', chunk => data += chunk)
          response.on('end', () => resolve(data))
        })
        request.on('error', reject)
        request.setTimeout(10000, () => {
          request.destroy()
          reject(new Error('Request timed out'))
        })
      })

      const html = await fetchContent()
      if (!html) {
        return sendJson(res, 400, { error: 'Failed to fetch URL (redirect not followed)' })
      }

      // Extract text content (basic HTML stripping)
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50000) // Limit size

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : new URL(targetUrl).hostname

      console.log(`  Extracted ${text.length} chars, title: "${title.slice(0, 50)}"`)

      // Generate summary and themes using AI
      const systemPrompt = `You are analyzing a source document for ThoughtBlend, a tool that synthesizes multiple perspectives.

Extract the key information from this document and return a JSON object with:
- summary: A 2-3 sentence summary of the main argument or perspective
- themes: An array of 3-5 key themes or topics (short phrases)
- stance: A brief description of the document's position/viewpoint
- keyPoints: An array of 3-5 main points made by the document

Return ONLY valid JSON, no explanation.`

      const prompt = `Document title: "${title}"

Content (first 5000 chars):
${text.slice(0, 5000)}

Analyze this document and extract its key information as JSON.`

      console.log(`  🤖 Analyzing content...`)
      const analysis = await callAI(systemPrompt, prompt)
      
      let parsed
      try {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        parsed = {
          summary: 'Could not automatically summarize. Review the content manually.',
          themes: [],
          stance: 'Unknown',
          keyPoints: []
        }
      }

      return sendJson(res, 200, {
        success: true,
        title,
        content: text,
        ...parsed
      })

    } catch (error) {
      console.error('❌ Fetch URL error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // Analyze pasted or uploaded text content
  if (url.pathname === '/thoughtblend/analyze' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { content, title } = body

      if (!content) {
        return sendJson(res, 400, { error: 'Missing content' })
      }

      console.log(`\n📝 Analyzing content: "${(title || 'untitled').slice(0, 50)}" (${content.length} chars)`)

      const systemPrompt = `You are analyzing a source document for ThoughtBlend, a tool that synthesizes multiple perspectives.

Extract the key information from this document and return a JSON object with:
- summary: A 2-3 sentence summary of the main argument or perspective
- themes: An array of 3-5 key themes or topics (short phrases)  
- stance: A brief description of the document's position/viewpoint
- keyPoints: An array of 3-5 main points made by the document

Return ONLY valid JSON, no explanation.`

      const prompt = `Document title: "${title || 'Untitled'}"

Content (first 5000 chars):
${content.slice(0, 5000)}

Analyze this document and extract its key information as JSON.`

      console.log(`  🤖 Analyzing...`)
      const analysis = await callAI(systemPrompt, prompt)
      
      let parsed
      try {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        parsed = {
          summary: 'Could not automatically summarize.',
          themes: [],
          stance: 'Unknown',
          keyPoints: []
        }
      }

      return sendJson(res, 200, {
        success: true,
        ...parsed
      })

    } catch (error) {
      console.error('❌ Analyze error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // Generate synthesis from multiple sources
  if (url.pathname === '/thoughtblend/synthesize' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { sources, acrimony = 0.5, mode = 'structured' } = body

      if (!sources || !Array.isArray(sources) || sources.length < 2) {
        return sendJson(res, 400, { error: 'Need at least 2 sources' })
      }

      console.log(`\n🎨 Synthesizing ${sources.length} sources`)
      console.log(`  Mode: ${mode}, Tension: ${Math.round(acrimony * 100)}%`)

      // Build source descriptions
      const sourceDescriptions = sources.map((s, i) => {
        const magnitude = s.magnitude || 1
        return `SOURCE ${i + 1} (weight: ${Math.round(magnitude * 100)}%):
Title: ${s.title}
Summary: ${s.summary || 'No summary available'}
Key themes: ${(s.themes || []).join(', ') || 'None identified'}
Stance: ${s.stance || 'Not specified'}
Key points: ${(s.keyPoints || []).map(p => '- ' + p).join('\n') || 'None identified'}
Content excerpt: ${(s.content || '').slice(0, 1500)}...
`
      }).join('\n---\n')

      // Determine synthesis style based on acrimony and mode
      let toneGuidance
      if (acrimony < 0.3) {
        toneGuidance = 'Find common ground and areas of agreement. Emphasize synthesis and complementary perspectives. Minimize conflict.'
      } else if (acrimony < 0.7) {
        toneGuidance = 'Present each perspective fairly. Acknowledge both agreements and disagreements. Be balanced and analytical.'
      } else {
        toneGuidance = 'Highlight tensions and contradictions. Let the sources challenge each other directly. Be provocative and dialectical.'
      }

      let formatGuidance
      if (mode === 'dialogue') {
        formatGuidance = `Format as a dialogue/debate between voices representing each source.
Use source titles or "Voice 1", "Voice 2" etc as speaker names.
Each voice should authentically represent its source's perspective.
Include back-and-forth exchanges where voices respond to each other.`
      } else {
        formatGuidance = `Format as a structured essay with clear sections:
1. Introduction - frame the topic and the perspectives being compared
2. Areas of Agreement - where sources converge
3. Points of Tension - where sources diverge or conflict
4. Synthesis - your analysis drawing from all sources
5. Conclusion - key takeaways`
      }

      const systemPrompt = `You are ThoughtBlend, an AI that synthesizes multiple perspectives into coherent discourse.

Your task is to create a ${mode === 'dialogue' ? 'dialogue' : 'structured essay'} that weaves together the following sources.

Tone guidance: ${toneGuidance}

Format guidance: ${formatGuidance}

Important:
- Weight each source according to its specified magnitude
- Cite or attribute ideas to their sources
- Don't just summarize - synthesize and analyze
- Make connections the sources themselves might not make
- Be intellectually honest about genuine disagreements`

      const prompt = `Here are the sources to synthesize:

${sourceDescriptions}

Create a ${mode === 'dialogue' ? 'dialogue between these perspectives' : 'structured synthesis essay'} with ${acrimony < 0.3 ? 'harmonious' : acrimony < 0.7 ? 'balanced' : 'contentious'} tone.

Output the synthesis directly as markdown. Include section headers.`

      console.log(`  🤖 Generating synthesis...`)
      const synthesis = await callAI(systemPrompt, prompt)

      return sendJson(res, 200, {
        success: true,
        synthesis: synthesis.trim(),
        mode,
        acrimony,
        sourceCount: sources.length
      })

    } catch (error) {
      console.error('❌ Synthesis error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // Suggest opposite/contrasting sources (placeholder - would need search API)
  if (url.pathname === '/thoughtblend/suggest-opposite' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { source } = body

      if (!source) {
        return sendJson(res, 400, { error: 'Missing source' })
      }

      console.log(`\n🔄 Generating opposite suggestions for: "${source.title?.slice(0, 50)}"`)

      const systemPrompt = `You are helping users find contrasting perspectives for ThoughtBlend.

Given a source document, suggest works/authors/perspectives that would provide meaningful intellectual opposition or contrast.

Return a JSON object with:
- suggestions: An array of 3-5 suggestions, each with:
  - title: Name of the work or a descriptive title
  - author: Author if known, or "Various" 
  - description: Why this contrasts with the original
  - searchQuery: A search query to find this content

Focus on substantive intellectual contrast, not just surface-level disagreement.`

      const prompt = `Original source:
Title: ${source.title}
Summary: ${source.summary || 'Not available'}
Themes: ${(source.themes || []).join(', ')}
Stance: ${source.stance || 'Not specified'}

Suggest contrasting perspectives that would create productive intellectual tension with this source.`

      console.log(`  🤖 Generating suggestions...`)
      const response = await callAI(systemPrompt, prompt)

      let suggestions
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        suggestions = JSON.parse(jsonMatch[0]).suggestions || []
      } catch {
        suggestions = []
      }

      return sendJson(res, 200, {
        success: true,
        suggestions
      })

    } catch (error) {
      console.error('❌ Suggest error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // ============================================================================
  // Version History Endpoints
  // ============================================================================
  
  // List versions for a tutorial
  if (url.pathname === '/api/versions' && req.method === 'GET') {
    try {
      const tutorialId = url.searchParams.get('tutorialId')
      if (!tutorialId) {
        return sendJson(res, 400, { error: 'Missing tutorialId parameter' })
      }
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const versions = await listVersions(jsonPath)
      
      return sendJson(res, 200, { 
        tutorialId,
        versions,
        count: versions.length
      })
    } catch (error) {
      console.error('❌ List versions error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Get a specific version
  if (url.pathname === '/api/versions/get' && req.method === 'GET') {
    try {
      const tutorialId = url.searchParams.get('tutorialId')
      const index = parseInt(url.searchParams.get('index'), 10)
      
      if (!tutorialId || isNaN(index)) {
        return sendJson(res, 400, { error: 'Missing tutorialId or index parameter' })
      }
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const { content, versionInfo } = await getVersion(jsonPath, index)
      
      return sendJson(res, 200, { 
        tutorialId,
        index,
        versionInfo,
        content
      })
    } catch (error) {
      console.error('❌ Get version error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Restore a version
  if (url.pathname === '/api/versions/restore' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, index } = body
      
      if (!tutorialId || index === undefined) {
        return sendJson(res, 400, { error: 'Missing tutorialId or index' })
      }
      
      console.log(`\n🔄 Restore version request: ${tutorialId} -> index ${index}`)
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const restoredInfo = await restoreVersion(jsonPath, index)
      
      // Also commit to git
      const commitMsg = `[restore] Restored to: ${restoredInfo.message}`
      commitAndPush(jsonPath, commitMsg).catch(() => {})
      
      return sendJson(res, 200, { 
        success: true,
        tutorialId,
        restoredFrom: restoredInfo
      })
    } catch (error) {
      console.error('❌ Restore version error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  // Create a manual version snapshot
  if (url.pathname === '/api/versions/create' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, message = 'Manual snapshot' } = body
      
      if (!tutorialId) {
        return sendJson(res, 400, { error: 'Missing tutorialId' })
      }
      
      console.log(`\n📸 Manual version snapshot: ${tutorialId}`)
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      const versionInfo = await createVersion(jsonPath, message, 'manual')
      
      return sendJson(res, 200, { 
        success: true,
        tutorialId,
        versionInfo
      })
    } catch (error) {
      console.error('❌ Create version error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }

  // ============================================================================
  // Quiz Generation Endpoint
  // ============================================================================
  
  if (url.pathname === '/api/generate-quiz' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { tutorialId, questionCount = 5, difficultyMix } = body
      
      if (!tutorialId) {
        return sendJson(res, 400, { error: 'Missing tutorialId' })
      }
      
      console.log(`\n📝 Generating quiz for: ${tutorialId}`)
      
      // Load the tutorial JSON
      const tutorialPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
      let tutorial
      try {
        const content = await fs.readFile(tutorialPath, 'utf-8')
        tutorial = JSON.parse(content)
      } catch (e) {
        return sendJson(res, 404, { error: `Tutorial not found: ${tutorialId}` })
      }
      
      // Extract key concepts from the tutorial
      const extractText = (node) => {
        if (!node) return ''
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(extractText).join(' ')
        if (node.children) return extractText(node.children)
        return ''
      }
      
      const tutorialText = extractText(tutorial.content).slice(0, 10000)
      const sectionTitles = tutorial.content?.children
        ?.filter(c => c.type === 'Section')
        ?.map(s => s.props?.title)
        ?.filter(Boolean) || []
      
      // Generate quiz questions using AI
      const systemPrompt = `You are creating a quiz for an educational tutorial called "${tutorial.title}".

The quiz should test understanding of the key concepts, not just memorization.
Create questions that help learners validate and reinforce their understanding.

Question types available:
1. multiple-choice: 4 options, one correct
2. true-false: statement is true or false
3. fill-in-blank: complete a statement (use ____ for blank)
4. ordering: put steps/items in correct order

Each question needs:
- id: unique identifier (q1, q2, etc.)
- type: one of the above types
- difficulty: 1 (easy), 2 (medium), 3 (hard)
- points: 10 for easy, 15 for medium, 20 for hard
- concept: what concept this tests
- question: the question text
- For multiple-choice: options array with {id, text}, correctAnswer (option id)
- For true-false: correctAnswer (boolean)
- For fill-in-blank: correctAnswer (string or array of acceptable answers)
- For ordering: items array with {id, text}, correctOrder (array of item ids)
- explanation: why the answer is correct (educational!)
- hint: optional hint for struggling learners`

      const generatePrompt = `Tutorial: "${tutorial.title}"
Subtitle: "${tutorial.subtitle || ''}"

Section topics: ${sectionTitles.join(', ')}

Tutorial content excerpt:
${tutorialText.slice(0, 5000)}

Create ${questionCount} quiz questions that test understanding of this material.

Mix of difficulties: ${JSON.stringify(difficultyMix || { easy: 2, medium: 2, hard: 1 })}
Mix of question types (use at least 2 different types).

Return a JSON object with this structure:
{
  "id": "${tutorialId}-quiz",
  "tutorialId": "${tutorialId}",
  "title": "${tutorial.title} Quiz",
  "description": "Test your understanding of ${tutorial.title}",
  "version": 1,
  "settings": {
    "shuffleQuestions": false,
    "shuffleOptions": true,
    "showExplanations": true,
    "passingScore": 70,
    "allowRetry": true
  },
  "questions": [
    // Your generated questions here
  ]
}

Return ONLY valid JSON. No markdown, no explanation outside JSON.`

      console.log(`  🤖 Generating ${questionCount} questions...`)
      const response = await callAI(systemPrompt, generatePrompt)
      
      // Parse the quiz JSON
      let quizContent
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          quizContent = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON object found in response')
        }
      } catch (parseError) {
        console.error('❌ Failed to parse quiz JSON:', parseError.message)
        console.log('Response preview:', response.slice(0, 500))
        return sendJson(res, 500, { error: 'Failed to parse generated quiz' })
      }
      
      // Validate and fix the quiz structure
      quizContent.id = `${tutorialId}-quiz`
      quizContent.tutorialId = tutorialId
      quizContent.createdAt = new Date().toISOString()
      quizContent.updatedAt = new Date().toISOString()
      
      if (!quizContent.settings) {
        quizContent.settings = {
          shuffleQuestions: false,
          shuffleOptions: true,
          showExplanations: true,
          passingScore: 70,
          allowRetry: true
        }
      }
      
      // Validate questions
      if (!Array.isArray(quizContent.questions)) {
        return sendJson(res, 500, { error: 'Generated quiz has no questions array' })
      }
      
      // Fix any missing question fields
      quizContent.questions = quizContent.questions.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        type: q.type || 'multiple-choice',
        difficulty: q.difficulty || 2,
        points: q.points || (q.difficulty === 1 ? 10 : q.difficulty === 3 ? 20 : 15),
        ...q
      }))
      
      // Save the quiz
      const quizPath = path.join(CONTENT_DIR, `${tutorialId}-quiz.json`)
      await fs.writeFile(quizPath, JSON.stringify(quizContent, null, 2))
      console.log(`  💾 Saved: ${quizPath}`)
      
      // Commit to git
      const commitMsg = `[quiz] Generated quiz for: ${tutorial.title}`
      commitAndPush(quizPath, commitMsg).catch(() => {})
      
      return sendJson(res, 200, {
        success: true,
        quiz: quizContent,
        message: `Generated ${quizContent.questions.length} questions for ${tutorial.title}`
      })
      
    } catch (error) {
      console.error('❌ Quiz generation error:', error)
      return sendJson(res, 500, { error: error.message })
    }
  }
  
  sendJson(res, 404, { error: 'Not found' })
})

// Start server
const aiInfo = getAIInfo()
server.listen(PORT, () => {
  console.log(`\n🚀 Annotation Server: http://localhost:${PORT}`)
  console.log(`\n🤖 AI Provider: ${aiInfo.provider}`)
  console.log(`   Model: ${aiInfo.model}`)
  if (aiInfo.region) console.log(`   Region: ${aiInfo.region}`)
  console.log(`\n   To switch providers, edit: ai-config.js`)
  console.log(`\nEndpoints:`)
  console.log(`  POST /annotate              - Create annotation`)
  console.log(`  POST /generate              - Generate new tutorial`)
  console.log(`  POST /regroup               - Reorganize annotations`)
  console.log(`  POST /api/generate-quiz     - Generate quiz for tutorial`)
  console.log(`  GET  /health                - Health check`)
  console.log(`  GET  /tutorials             - List tutorials`)
  console.log(`\nThoughtBlend:`)
  console.log(`  POST /thoughtblend/fetch-url       - Fetch & analyze URL`)
  console.log(`  POST /thoughtblend/analyze         - Analyze text content`)
  console.log(`  POST /thoughtblend/synthesize      - Generate synthesis`)
  console.log(`  POST /thoughtblend/suggest-opposite - Suggest contrasts`)
  console.log(`\nContent: ${CONTENT_DIR}`)
})
