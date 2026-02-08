/**
 * Semantic Tree Generator
 * 
 * Creates a meaning-based tree structure from tutorial content.
 * Instead of mirroring JSON structure, chunks content by semantic coherence.
 * 
 * Supports recursive expansion: nodes can be expanded on-demand,
 * with results cached in the tree structure.
 * 
 * Each node stores:
 * - summary: Text summary for humans and RAG text matching
 * - embedding: 1024-dim vector for semantic similarity
 */

import { callAI, generateEmbedding } from './ai-config.js'
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
- "startMarker": A unique phrase (8+ words, VERBATIM from content) marking the START
- "endMarker": A unique phrase (8+ words, VERBATIM from content) marking the END

CRITICAL: startMarker and endMarker must be EXACT quotes from the content above. They define what text belongs to this chunk.

Guidelines:
- A question and its answer should be ONE chunk
- Related explanations should be grouped together
- Don't split analogies from what they're explaining
- Each chunk should be 100-500 words of content
- Chunks should not overlap

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
    return {
      chunks: [{
        title: sectionTitle,
        summary: 'All section content',
        sourceText: flatText,
        sourceAnchor: { startChar: 0, endChar: flatText.length }
      }],
      elements,
      flatText
    }
  }
  
  // Map chunks to actual source text using markers
  const result = []
  for (const chunk of chunks) {
    // Find the actual text range
    const startIdx = flatText.indexOf(chunk.startMarker)
    let endIdx = chunk.endMarker ? flatText.indexOf(chunk.endMarker) : -1
    
    if (startIdx === -1) {
      console.log(`  ⚠️ Couldn't find start marker for "${chunk.title}"`)
      // Try fuzzy match
      const words = chunk.startMarker.split(' ').slice(0, 3).join(' ')
      const fuzzyIdx = flatText.indexOf(words)
      if (fuzzyIdx !== -1) {
        console.log(`    Found fuzzy match at ${fuzzyIdx}`)
      }
      continue
    }
    
    if (endIdx === -1) {
      // Find next chunk's start or end of text
      endIdx = flatText.length
    } else {
      endIdx += chunk.endMarker.length
    }
    
    // Extract the actual source text for this chunk
    const sourceText = flatText.slice(startIdx, endIdx).trim()
    
    result.push({
      title: chunk.title,
      summary: chunk.summary,
      sourceText: sourceText,  // The actual content!
      sourceAnchor: {
        startChar: startIdx,
        endChar: endIdx,
        startMarker: chunk.startMarker,
        endMarker: chunk.endMarker
      }
    })
    
    console.log(`  ✓ "${chunk.title}" (${sourceText.length} chars)`)
  }
  
  return { chunks: result, elements, flatText }
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
        // Store actual source text for this chunk
        sourceText: chunk.sourceText,
        sourceAnchor: chunk.sourceAnchor,
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
 * Generate embeddings for all nodes in a tree
 * Computes embeddings for summaries and aggregates for parents
 */
export async function computeTreeEmbeddings(tree) {
  console.log('\n🧮 Computing embeddings for tree...')
  
  let count = 0
  
  async function processNode(node) {
    // Generate embedding for this node's summary
    if (node.summary && !node.embedding) {
      const textToEmbed = `${node.title}. ${node.summary}`
      try {
        node.embedding = await generateEmbedding(textToEmbed)
        count++
        console.log(`  ✓ Embedded: ${node.title.slice(0, 40)}...`)
      } catch (e) {
        console.log(`  ⚠️ Failed to embed: ${node.title} - ${e.message}`)
      }
    }
    
    // Process children first (depth-first)
    if (node.children) {
      for (const child of node.children) {
        await processNode(child)
      }
      
      // After children are processed, compute aggregate embedding for this parent
      const childEmbeddings = node.children
        .filter(c => c.embedding)
        .map(c => c.embedding)
      
      if (childEmbeddings.length > 0 && node.embedding) {
        // Store both the summary embedding and child aggregate
        node.childEmbeddingAggregate = averageEmbeddings(childEmbeddings)
        console.log(`  📊 Aggregated ${childEmbeddings.length} child embeddings for: ${node.title.slice(0, 30)}...`)
      }
    }
  }
  
  await processNode(tree)
  console.log(`\n✅ Generated ${count} embeddings`)
  
  return tree
}

/**
 * Average multiple embedding vectors
 */
function averageEmbeddings(embeddings) {
  if (embeddings.length === 0) return null
  if (embeddings.length === 1) return embeddings[0]
  
  const dim = embeddings[0].length
  const result = new Array(dim).fill(0)
  
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      result[i] += emb[i]
    }
  }
  
  // Normalize
  const norm = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0))
  return result.map(v => v / norm)
}

/**
 * Expand a leaf node into sub-concepts
 * Returns the new children to add to the node
 * 
 * Mode:
 * - 'faithful' (default): Only explain what's in the source text
 * - 'enriched': Can add external knowledge (clearly marked)
 */
export async function expandNode(node, parentContext = '', mode = 'faithful') {
  console.log(`\n🔍 Expanding node: ${node.title} (mode: ${mode})`)
  
  // Use sourceText if available, otherwise just summary
  const sourceContent = node.sourceText || node.summary
  const hasSourceText = !!node.sourceText
  
  const faithfulPrompt = `You are analyzing SOURCE TEXT to help learners understand what it says.

CONCEPT: ${node.title}
SUMMARY: ${node.summary}
${hasSourceText ? `\nSOURCE TEXT:\n${sourceContent.slice(0, 3000)}` : ''}
PARENT CONTEXT: ${parentContext || 'Top-level concept'}

CRITICAL RULE: You must ONLY explain what is actually stated or directly implied by the source text above.
- Do NOT add external knowledge, even if you know it's correct
- Do NOT make claims the source doesn't support
- If the source is vague, your explanation should acknowledge that vagueness

Your job is to break the SOURCE TEXT into 2-5 sub-concepts that help explain what IT says.

Return a JSON array of sub-concepts, each with:
- "title": Clear title (3-8 words) naming the concept as described in the source
- "summary": A 2-4 sentence explanation of what the SOURCE TEXT says about this. Use phrases like "According to the text..." or "The source explains that..."
- "sourceQuote": ${hasSourceText ? 'A VERBATIM quote (20+ words) from the source text that supports this sub-concept. This is REQUIRED.' : '"" (empty string)'}
- "isAtomic": true ONLY for single scientific terms (neuron, synapse, axon)

If you cannot find source text to support a sub-concept, do NOT include it.

Return ONLY valid JSON array.`

  const enrichedPrompt = `You are helping learners understand a concept by adding helpful context.

CONCEPT: ${node.title}
SUMMARY: ${node.summary}
${hasSourceText ? `\nSOURCE TEXT:\n${sourceContent.slice(0, 3000)}` : ''}
PARENT CONTEXT: ${parentContext || 'Top-level concept'}

You may add external knowledge to help explain this concept, but clearly distinguish:
- What the source text says
- What you're adding from general knowledge

Return a JSON array of sub-concepts, each with:
- "title": Clear title (3-8 words)
- "summary": 2-4 sentence teaching explanation
- "sourceQuote": Verbatim quote from source if applicable, or "" if adding external knowledge
- "isExternal": true if this adds knowledge beyond what the source says
- "isAtomic": true ONLY for single scientific terms

Return ONLY valid JSON array.`

  const response = await callAI(
    mode === 'faithful' 
      ? 'You are a careful reader who explains ONLY what a source text says. Never add external knowledge.'
      : 'You are an expert teacher who explains concepts thoroughly, clearly marking when you add external knowledge.',
    mode === 'faithful' ? faithfulPrompt : enrichedPrompt
  )
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // If AI returned atomic anyway, force expansion with a simpler prompt
    if (parsed.atomic) {
      console.log(`  ⚠️ AI claimed atomic, forcing expansion...`)
      // Return a single "deep explanation" child instead
      return {
        atomic: false,
        children: [{
          id: `${node.id}-explain`,
          title: `Understanding: ${node.title}`,
          summary: `${node.summary}\n\nThis concept involves understanding the underlying mechanism and why it matters in the broader context of ${parentContext || 'this topic'}.`,
          sourceText: node.sourceText || '',
          isLeaf: true,
          canExpand: true,
          expanded: false,
          isAtomic: false,
          generatedAt: new Date().toISOString()
        }]
      }
    }
    
    // It's an array of sub-concepts
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array of sub-concepts')
    }
    
    console.log(`  📊 Generated ${parsed.length} sub-concepts`)
    
    // In faithful mode, verify each sub-concept has source support
    const validChildren = []
    for (const sub of parsed) {
      let sourceText = sub.sourceQuote || ''
      let isGrounded = true
      
      if (mode === 'faithful') {
        // Verify the quote exists in the source
        if (sourceText && node.sourceText) {
          const idx = node.sourceText.indexOf(sourceText.slice(0, 30))
          if (idx === -1) {
            console.log(`    ⚠️ Quote not found for "${sub.title}" - checking if grounded...`)
            // Check if key terms from summary appear in source
            const summaryWords = sub.summary.toLowerCase().split(/\s+/).filter(w => w.length > 4)
            const sourceWords = (node.sourceText || node.summary).toLowerCase()
            const foundWords = summaryWords.filter(w => sourceWords.includes(w))
            isGrounded = foundWords.length >= summaryWords.length * 0.3
            
            if (!isGrounded) {
              console.log(`    ❌ Rejecting "${sub.title}" - not grounded in source`)
              continue
            }
          }
        } else if (!sourceText && mode === 'faithful') {
          // No source quote in faithful mode - skip unless summary seems grounded
          const summaryWords = sub.summary.toLowerCase().split(/\s+/).filter(w => w.length > 4)
          const sourceWords = (node.sourceText || node.summary).toLowerCase()
          const foundWords = summaryWords.filter(w => sourceWords.includes(w))
          isGrounded = foundWords.length >= summaryWords.length * 0.3
          
          if (!isGrounded) {
            console.log(`    ❌ Rejecting "${sub.title}" - no source support`)
            continue
          }
        }
      }
      
      validChildren.push({
        id: `${node.id}-sub-${validChildren.length}`,
        title: sub.title,
        summary: sub.summary,
        sourceText: sourceText,
        isLeaf: true,
        canExpand: !sub.isAtomic,
        expanded: false,
        isAtomic: sub.isAtomic || false,
        isExternal: sub.isExternal || false,  // Track if this adds external knowledge
        isGrounded: isGrounded,
        generatedAt: new Date().toISOString()
      })
    }
    
    if (validChildren.length === 0) {
      console.log(`  ⚠️ No grounded children found, keeping node as-is`)
      return { atomic: true, reason: 'Could not find grounded sub-concepts in source text' }
    }
    
    const children = validChildren
    
    // Generate an enriched parent summary that encompasses the children
    const childSummaries = children.map(c => `• ${c.title}: ${c.summary}`).join('\n')
    const enrichPrompt = `A concept has been expanded into sub-concepts. Update the parent summary to encompass all child content.

PARENT CONCEPT: ${node.title}
ORIGINAL SUMMARY: ${node.summary}

CHILD CONCEPTS:
${childSummaries}

Write a NEW summary (2-4 sentences) for the parent that:
1. Retains the core meaning of the original
2. Hints at the key sub-concepts so queries about them will match
3. Is self-contained (someone reading just this summary understands the scope)

Return ONLY the new summary text, no JSON or formatting.`

    console.log('  📝 Generating enriched parent summary...')
    const enrichedSummary = await callAI(
      'You write concise, comprehensive summaries for hierarchical knowledge retrieval.',
      enrichPrompt
    )
    
    return { 
      atomic: false, 
      children,
      enrichedParentSummary: enrichedSummary.trim()
    }
    
  } catch (e) {
    console.error('  ❌ Failed to parse expansion:', e.message)
    return { atomic: true, reason: 'Failed to analyze' }
  }
}
