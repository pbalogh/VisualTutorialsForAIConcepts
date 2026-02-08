/**
 * Semantic Tree Generator
 * 
 * Creates a meaning-based tree structure from tutorial content.
 * Instead of mirroring JSON structure, chunks content by semantic coherence.
 * 
 * Supports recursive expansion: nodes can be expanded on-demand,
 * with results cached in the tree structure.
 */

import { callAI } from './ai-config.js'
import crypto from 'crypto'

/**
 * Generate a hash of content for cache invalidation
 */
function hashContent(content) {
  const str = JSON.stringify(content)
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 12)
}

/**
 * Flatten a section's content into text with element markers
 */
function flattenContent(node, elements = [], path = []) {
  if (!node) return ''
  
  if (typeof node === 'string') return node + ' '
  
  // Track this element
  const elementIndex = elements.length
  elements.push({ index: elementIndex, path: [...path], node })
  
  let text = ''
  
  // Add type marker for context
  if (node.type === 'h3' || node.type === 'h4') {
    text += `\n\n### `
  } else if (node.type === 'Callout') {
    text += `\n[CALLOUT: `
  } else if (node.type === 'Sidebar') {
    text += `\n[SIDEBAR: `
  } else if (node.type === 'DeepDive') {
    text += `\n[DEEPDIVE: `
  } else if (node.type === 'Example') {
    text += `\n[EXAMPLE: `
  }
  
  // Extract text content
  if (node.props?.title) {
    text += node.props.title + '] '
  }
  
  if (node.children) {
    const children = Array.isArray(node.children) ? node.children : [node.children]
    children.forEach((child, i) => {
      text += flattenContent(child, elements, [...path, i])
    })
  }
  
  if (node.type === 'p') text += '\n'
  
  return text
}

/**
 * Generate semantic tree for a section
 */
export async function generateSemanticTree(sectionContent, sectionTitle) {
  // Flatten content and track elements
  const elements = []
  const flatText = flattenContent(sectionContent, elements)
  
  console.log(`  Flattened ${elements.length} elements, ${flatText.length} chars`)
  
  // Ask AI to chunk semantically
  const chunkPrompt = `Analyze this educational content and divide it into 3-7 semantically coherent "thought chunks". Each chunk should be a complete concept that a reader would naturally think of as one unit.

SECTION: ${sectionTitle}

CONTENT:
${flatText.slice(0, 6000)}

Return a JSON array of chunks. For each chunk:
- "title": Brief descriptive title (5-10 words)
- "summary": One-sentence summary of the concept
- "startMarker": A unique phrase (5+ words) from the START of this chunk's content
- "endMarker": A unique phrase (5+ words) from the END of this chunk's content

Guidelines:
- A question and its answer should be ONE chunk
- Related explanations should be grouped together
- Don't split analogies from what they're explaining
- Each chunk should be 100-500 words of content

Return ONLY valid JSON array.`

  const aiResponse = await callAI(
    'You are an expert at organizing educational content into meaningful semantic units. Return only valid JSON.',
    chunkPrompt
  )
  
  let chunks
  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found')
    chunks = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Failed to parse chunks:', e.message)
    // Fallback: single chunk with all content
    return [{
      title: sectionTitle,
      summary: 'All section content',
      elements: elements.map(e => e.index)
    }]
  }
  
  // Map chunks to element indices using markers
  const result = []
  for (const chunk of chunks) {
    // Find elements between start and end markers
    const startIdx = flatText.indexOf(chunk.startMarker)
    const endIdx = chunk.endMarker ? flatText.indexOf(chunk.endMarker) + chunk.endMarker.length : flatText.length
    
    if (startIdx === -1) {
      console.log(`  ⚠️ Couldn't find start marker for "${chunk.title}"`)
      continue
    }
    
    // Find which elements fall within this range
    // This is approximate - we'll include elements whose text appears in the range
    const chunkElements = []
    let currentPos = 0
    
    for (const el of elements) {
      const elText = flattenContent(el.node, [], [])
      const elStart = flatText.indexOf(elText, currentPos)
      if (elStart >= startIdx && elStart < endIdx) {
        chunkElements.push(el.index)
      }
      if (elStart !== -1) currentPos = elStart + 1
    }
    
    result.push({
      title: chunk.title,
      summary: chunk.summary,
      elementIndices: chunkElements.length > 0 ? chunkElements : [0] // Fallback
    })
  }
  
  return { chunks: result, elements }
}

/**
 * Generate full semantic tree for a tutorial
 */
export async function generateFullSemanticTree(tutorial) {
  console.log(`\n🌳 Generating semantic tree for: ${tutorial.title}`)
  
  const sections = tutorial.content.children.filter(c => c.type === 'Section')
  
  // Generate top-level summary
  const allTitles = sections.map(s => s.props?.title || 'Untitled').join(', ')
  
  const summaryPrompt = `Create a one-sentence summary of this tutorial.

TITLE: ${tutorial.title}
SECTIONS: ${allTitles}

Return ONLY the summary sentence, nothing else.`

  const tutorialSummary = await callAI(
    'You summarize educational content concisely.',
    summaryPrompt
  )
  
  // Process each section
  const tree = {
    id: 'root',
    title: tutorial.title,
    summary: tutorialSummary.trim(),
    children: []
  }
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const sectionTitle = section.props?.title || `Section ${i + 1}`
    
    console.log(`\n📚 Processing section ${i + 1}: ${sectionTitle}`)
    
    // Generate section summary
    const sectionText = flattenContent(section, [], []).slice(0, 2000)
    const sectionSummaryPrompt = `Summarize this section in one sentence:

${sectionText}

Return ONLY the summary sentence.`

    const sectionSummary = await callAI(
      'You summarize educational content.',
      sectionSummaryPrompt
    )
    
    // Generate semantic chunks for this section
    const { chunks, elements } = await generateSemanticTree(section, sectionTitle)
    
    tree.children.push({
      id: `section-${i}`,
      title: sectionTitle,
      summary: sectionSummary.trim(),
      contentHash: hashContent(section),
      children: chunks.map((chunk, j) => ({
        id: `section-${i}-chunk-${j}`,
        title: chunk.title,
        summary: chunk.summary,
        // Store element references for rendering
        elementIndices: chunk.elementIndices,
        sectionIndex: i,
        isLeaf: true,
        canExpand: true,  // All leaves can potentially be expanded
        expanded: false
      }))
    })
  }
  
  tree.contentHash = hashContent(tutorial.content)
  tree.generatedAt = new Date().toISOString()
  
  return tree
}

/**
 * Expand a leaf node into sub-concepts
 * Returns the new children to add to the node
 */
export async function expandNode(node, parentContext = '') {
  console.log(`\n🔍 Expanding node: ${node.title}`)
  
  const expandPrompt = `You are analyzing a concept to determine if it can be broken into meaningful sub-concepts.

CONCEPT: ${node.title}
SUMMARY: ${node.summary}
PARENT CONTEXT: ${parentContext || 'Top-level concept'}

Analyze this concept. Can it be meaningfully decomposed into 2-5 sub-concepts that would help someone understand it better?

If YES: Return a JSON array of sub-concepts, each with:
- "title": Brief title (3-8 words)
- "summary": One-sentence explanation
- "isAtomic": true if this sub-concept is fundamental and doesn't need further breakdown

If NO (the concept is already atomic/fundamental): Return {"atomic": true, "reason": "brief explanation"}

Examples of atomic concepts: "action potential", "neuron", "frequency"
Examples of expandable concepts: "how neurons communicate", "memory encoding process"

Return ONLY valid JSON.`

  const response = await callAI(
    'You are an expert at decomposing complex concepts into learnable sub-concepts. Be judicious - only expand when it genuinely helps understanding.',
    expandPrompt
  )
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Check if atomic
    if (parsed.atomic) {
      console.log(`  ⚛️ Node is atomic: ${parsed.reason}`)
      return { atomic: true, reason: parsed.reason }
    }
    
    // It's an array of sub-concepts
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array of sub-concepts')
    }
    
    console.log(`  📊 Generated ${parsed.length} sub-concepts`)
    
    const children = parsed.map((sub, i) => ({
      id: `${node.id}-sub-${i}`,
      title: sub.title,
      summary: sub.summary,
      isLeaf: true,
      canExpand: !sub.isAtomic,
      expanded: false,
      isAtomic: sub.isAtomic || false,
      generatedAt: new Date().toISOString()
    }))
    
    return { atomic: false, children }
    
  } catch (e) {
    console.error('  ❌ Failed to parse expansion:', e.message)
    return { atomic: true, reason: 'Failed to analyze' }
  }
}
