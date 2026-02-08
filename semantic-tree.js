/**
 * Semantic Tree Generator
 * 
 * Creates a meaning-based tree structure from tutorial content.
 * Instead of mirroring JSON structure, chunks content by semantic coherence.
 */

import { callAI } from './ai-config.js'

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
      children: chunks.map((chunk, j) => ({
        id: `section-${i}-chunk-${j}`,
        title: chunk.title,
        summary: chunk.summary,
        // Store element references for rendering
        elementIndices: chunk.elementIndices,
        sectionIndex: i,
        isLeaf: true
      }))
    })
  }
  
  return tree
}
