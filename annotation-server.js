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
      
      return {
        type: 'Callout',
        props: { type: 'info' },
        children: [
          {
            type: 'strong',
            children: `💡 "${selectedText}":`
          },
          ' ',
          explanation.trim(),
          ' ',
          {
            type: 'em',
            props: { className: 'text-gray-400 text-xs' },
            children: `(${timestamp})`
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
      
      // Parse for potential structured content (if AI returns JSON-like structure)
      // Otherwise treat as text paragraphs
      const paragraphs = answer.trim().split('\n\n').filter(p => p.trim())
      
      return {
        type: 'DeepDive',
        props: { 
          title: `❓ Q: ${question}`,
          defaultOpen: true 
        },
        children: [
          {
            type: 'Callout',
            props: { type: 'info' },
            children: [
              { type: 'em', children: `About "${selectedText}"` }
            ]
          },
          ...paragraphs.map(p => ({
            type: 'p',
            children: p.trim()
          })),
          {
            type: 'em',
            props: { className: 'text-gray-400 text-xs block mt-4' },
            children: `(${timestamp})`
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
function insertAnnotation(content, selectedText, annotation, action) {
  const newContent = JSON.parse(JSON.stringify(content))
  const annotationId = generateAnnotationId()
  
  // Add ID to the annotation for linking
  annotation.props = annotation.props || {}
  annotation.props.id = annotationId
  
  // Create inline marker that links to the annotation
  const inlineMarker = {
    type: 'AnnotationMarker',
    props: { 
      targetId: annotationId, 
      type: action,
      label: action === 'branch' ? '🌿' : '💡'
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
    
    // Insert marker inline with the text
    // We'll modify the string to include a marker reference
    const originalText = searchResult.node
    const markerRef = `[[${annotationId}]]`
    
    // For simple string replacement, add marker at end of the text
    // (A more sophisticated approach would wrap the selected portion)
    const newText = originalText.replace(
      selectedText,
      selectedText + ` `
    )
    
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
      const { action, selectedText, context, tutorialId, question } = body
      
      console.log('\n📝 Annotation Request:')
      console.log(`  Action: ${action}`)
      console.log(`  Tutorial: ${tutorialId}`)
      console.log(`  Selected: "${selectedText?.slice(0, 50)}..."`)
      if (question) console.log(`  Question: "${question?.slice(0, 50)}..."`)
      
      if (!action || !selectedText || !tutorialId) {
        return sendJson(res, 400, { error: 'Missing required fields' })
      }
      
      if (!['explain', 'branch', 'ask'].includes(action)) {
        return sendJson(res, 400, { error: 'Action must be explain, branch, or ask' })
      }
      
      if (action === 'ask' && !question) {
        return sendJson(res, 400, { error: 'Question is required for ask action' })
      }
      
      const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
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
      
      const commitMsg = `[${action}] "${selectedText.slice(0, 40)}..." in ${tutorialId}`
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
