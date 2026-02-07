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
 */
function findAllAnnotations(node, path = '') {
  const annotations = []
  
  if (!node) return annotations
  
  // Sidebar annotations
  if (node.type === 'Sidebar') {
    annotations.push({
      type: 'sidebar',
      subtype: node.props?.type || 'note',
      title: node.props?.title || 'Untitled',
      content: extractTextContent(node.children).slice(0, 200),
      path
    })
  }
  
  // DeepDive sections (often from "Go Deeper")
  if (node.type === 'DeepDive') {
    annotations.push({
      type: 'deepdive',
      title: node.props?.title || 'Deep Dive',
      content: extractTextContent(node.children).slice(0, 200),
      path
    })
  }
  
  // Callouts with 💡 (inline explanations)
  if (node.type === 'Callout' && extractTextContent(node.children).includes('💡')) {
    annotations.push({
      type: 'explanation',
      content: extractTextContent(node.children).slice(0, 200),
      path
    })
  }
  
  // Q&A style annotations (buttons with ❓)
  if (node.type === 'button' && node.children && extractTextContent(node.children).includes('❓')) {
    annotations.push({
      type: 'question',
      content: extractTextContent(node.children).slice(0, 200),
      path
    })
  }
  
  // Footnote annotations
  if (node.type === 'Footnote') {
    annotations.push({
      type: 'footnote',
      reference: node.props?.reference,
      content: extractTextContent(node.children).slice(0, 200),
      path
    })
  }
  
  // Recurse into children
  if (node.children) {
    const children = Array.isArray(node.children) ? node.children : [node.children]
    children.forEach((child, i) => {
      if (typeof child === 'object') {
        annotations.push(...findAllAnnotations(child, `${path}.children[${i}]`))
      }
    })
  }
  
  return annotations
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
      
      if (!['explain', 'branch', 'ask', 'footnote'].includes(action)) {
        return sendJson(res, 400, { error: 'Action must be explain, branch, ask, or footnote' })
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
      const { tutorialId, aggressive = false } = body
      
      console.log('\n🔄 Regroup Request:')
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Mode: ${aggressive ? 'aggressive' : 'conservative'}`)
      
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
      
      // Summarize annotations for the AI
      const annotationSummary = annotations.map((a, i) => 
        `${i+1}. [${a.type}${a.subtype ? ':'+a.subtype : ''}] ${a.title || ''} - "${a.content}"`
      ).join('\n')
      
      // Call AI with the "editor's notes" framing
      const systemPrompt = `You are a senior editor revising an educational tutorial called "${content.title}".

The tutorial has accumulated reader annotations - questions, requests for clarification, and "go deeper" expansions. Think of these as EDITOR'S NOTES on a manuscript: they represent places where readers were confused or curious.

Your job is to REVISE THE TUTORIAL ITSELF so that these questions wouldn't need to be asked. The goal is a clean, self-contained tutorial where:
- Confusing terms are explained BEFORE they're used (or inline when first used)
- "Go deeper" content is integrated as proper sections if important, or removed if tangential
- Q&A exchanges are absorbed into the main text as clear explanations
- Sidebars with important info become part of the main flow
- Redundant annotations are consolidated or removed

${aggressive ? `AGGRESSIVE REVISION:
- Be bold. Restructure sections if needed.
- Remove annotations entirely after integrating their insights.
- Combine related Q&A into consolidated explanations.
- Cut tangential deep-dives that distract from the main narrative.` : `CONSERVATIVE REVISION:
- Preserve the structure, but improve the prose.
- Keep valuable annotations as sidebars if they're truly supplementary.
- Integrate only the most essential clarifications into main text.
- Don't remove content unless it's clearly redundant.`}

Return the FULL revised tutorial JSON.`

      const prompt = `Here are the reader annotations (editor's notes) on this tutorial:

${annotationSummary}

Here is the full tutorial JSON:

${JSON.stringify(content, null, 2)}

Revise the tutorial to address these reader needs. Return the FULL modified JSON.
Only return valid JSON, no markdown or explanation.`

      console.log('🤖 Calling AI to revise tutorial as editor...')
      const response = await callAI(systemPrompt, prompt)
      
      let updatedContent
      try {
        // Try to parse the response as JSON directly
        updatedContent = JSON.parse(response.trim())
      } catch {
        // Try to extract JSON from markdown code blocks or raw response
        let jsonStr = response.trim()
        
        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7)
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3)
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3)
        }
        jsonStr = jsonStr.trim()
        
        try {
          updatedContent = JSON.parse(jsonStr)
        } catch {
          // Last resort: find the outermost JSON object
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              updatedContent = JSON.parse(jsonMatch[0])
            } catch (e) {
              console.error('Failed to parse AI response as JSON:', e.message)
              console.error('Response preview:', response.slice(0, 500))
              return sendJson(res, 500, { error: 'AI returned invalid JSON - try again' })
            }
          } else {
            console.error('No JSON found in response')
            console.error('Response preview:', response.slice(0, 500))
            return sendJson(res, 500, { error: 'AI returned invalid JSON - try again' })
          }
        }
      }
      
      // Validate the response has the expected structure
      if (!updatedContent || !updatedContent.content) {
        console.error('AI response missing content field')
        return sendJson(res, 500, { error: 'AI returned incomplete tutorial structure' })
      }
      
      // Count annotations before and after
      const newAnnotations = findAllAnnotations(updatedContent.content)
      const removedCount = annotations.length - newAnnotations.length
      
      // Save the updated content
      await fs.writeFile(jsonPath, JSON.stringify(updatedContent, null, 2))
      console.log(`💾 Saved: ${jsonPath}`)
      console.log(`📊 Annotations: ${annotations.length} → ${newAnnotations.length} (${removedCount > 0 ? removedCount + ' integrated/removed' : 'restructured'})`)
      
      // Commit to git (for undo capability)
      const commitMsg = `[regroup${aggressive ? '-aggressive' : ''}] ${annotations.length}→${newAnnotations.length} annotations in ${tutorialId}`
      commitAndPush(jsonPath, commitMsg).catch(() => {})
      
      return sendJson(res, 200, {
        success: true,
        tutorialId,
        beforeCount: annotations.length,
        afterCount: newAnnotations.length,
        changes: removedCount,
        message: removedCount > 0 
          ? `Revised tutorial: ${removedCount} annotation${removedCount > 1 ? 's' : ''} integrated into main text`
          : 'Tutorial revised and restructured',
        updatedContent
      })
      
    } catch (error) {
      console.error('❌ Regroup error:', error)
      return sendJson(res, 500, { error: error.message })
    }
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
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          tutorialContent = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON object found in response')
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
  console.log(`  POST /annotate  - Create annotation`)
  console.log(`  GET  /health    - Health check`)
  console.log(`  GET  /tutorials - List tutorials`)
  console.log(`\nContent: ${CONTENT_DIR}`)
})
