/**
 * Hierarchical RAG Pipeline
 * 
 * Performs retrieval-augmented generation using the semantic tree structure.
 * 
 * Key innovations:
 * 1. Hierarchical pruning: Only drill into relevant branches
 * 2. Dual matching: Text summaries + embedding vectors
 * 3. Context assembly: Builds coherent context from tree path
 * 4. Source attribution: Tracks which nodes contributed to answer
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { callAI, generateEmbedding, cosineSimilarity } from './ai-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, 'src', 'content')

/**
 * Load semantic tree for a tutorial
 */
async function loadSemanticTree(tutorialId) {
  const treePath = path.join(CONTENT_DIR, `${tutorialId}-semantic-tree.json`)
  const data = JSON.parse(await fs.readFile(treePath, 'utf-8'))
  return data.tree
}

/**
 * Hierarchical search with pruning
 * Returns relevant nodes with their full path context
 */
async function hierarchicalSearch(tree, queryEmbedding, options = {}) {
  const {
    maxResults = 5,
    minScore = 0.3,
    pruneThreshold = 0.25,  // Don't drill into branches below this
    maxDepth = 10
  } = options
  
  const results = []
  
  async function searchNode(node, ancestors = [], depth = 0) {
    if (depth > maxDepth) return
    if (!node.embedding) return
    
    // Compute similarity scores
    const summaryScore = cosineSimilarity(queryEmbedding, node.embedding)
    const childScore = node.childEmbeddingAggregate 
      ? cosineSimilarity(queryEmbedding, node.childEmbeddingAggregate)
      : 0
    
    const score = Math.max(summaryScore, childScore * 0.95)
    
    // Record this node if relevant
    if (score >= minScore) {
      results.push({
        node,
        score,
        summaryScore,
        childScore,
        depth,
        path: ancestors.map(a => a.title),
        isLeaf: !node.children || node.children.length === 0
      })
    }
    
    // Prune: don't drill into low-relevance branches
    if (score < pruneThreshold) {
      return
    }
    
    // Recurse into children
    if (node.children) {
      for (const child of node.children) {
        await searchNode(child, [...ancestors, node], depth + 1)
      }
    }
  }
  
  await searchNode(tree)
  
  // Sort by score, return top results
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, maxResults)
}

/**
 * Assemble context from search results
 * Builds a coherent narrative from the tree structure
 */
function assembleContext(results, maxTokens = 3000) {
  // Group by path to avoid redundancy
  const byPath = new Map()
  
  for (const result of results) {
    const pathKey = result.path.join(' > ')
    if (!byPath.has(pathKey)) {
      byPath.set(pathKey, [])
    }
    byPath.get(pathKey).push(result)
  }
  
  // Build context string
  const sections = []
  let totalChars = 0
  const maxChars = maxTokens * 4  // Rough token estimate
  
  for (const [pathKey, nodes] of byPath) {
    if (totalChars > maxChars) break
    
    const section = []
    
    // Add path as header
    if (pathKey) {
      section.push(`## ${pathKey}`)
    }
    
    // Add node content
    for (const { node, score } of nodes) {
      if (totalChars > maxChars) break
      
      const content = node.sourceText || node.summary
      section.push(`### ${node.title} (relevance: ${(score * 100).toFixed(0)}%)`)
      section.push(content)
      totalChars += content.length
    }
    
    sections.push(section.join('\n\n'))
  }
  
  return {
    context: sections.join('\n\n---\n\n'),
    sources: results.map(r => ({
      id: r.node.id,
      title: r.node.title,
      path: r.path,
      score: r.score
    }))
  }
}

/**
 * Main RAG query function
 */
export async function ragQuery(tutorialId, question, options = {}) {
  const {
    maxContextTokens = 3000,
    includeSourceAttribution = true,
    systemPrompt = null
  } = options
  
  console.log(`\n🔍 RAG Query: "${question}"`)
  
  // Load tree
  const tree = await loadSemanticTree(tutorialId)
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(question)
  
  // Hierarchical search
  const results = await hierarchicalSearch(tree, queryEmbedding, {
    maxResults: 8,
    minScore: 0.25
  })
  
  console.log(`  Found ${results.length} relevant nodes`)
  results.slice(0, 3).forEach(r => {
    console.log(`    - ${r.node.title} (${(r.score * 100).toFixed(0)}%)`)
  })
  
  // Assemble context
  const { context, sources } = assembleContext(results, maxContextTokens)
  
  // Generate answer
  const defaultSystemPrompt = `You are an expert tutor answering questions based on provided educational content.
Use ONLY the information from the context below. If the context doesn't contain enough information to fully answer, say so.
Be clear, educational, and thorough.`

  const userPrompt = `CONTEXT FROM TUTORIAL:
${context}

---

QUESTION: ${question}

Please answer the question based on the context above.${includeSourceAttribution ? ' Cite specific sections when relevant.' : ''}`

  const answer = await callAI(
    systemPrompt || defaultSystemPrompt,
    userPrompt
  )
  
  return {
    question,
    answer,
    sources,
    searchResults: results.length,
    contextLength: context.length
  }
}

/**
 * Multi-hop RAG: Follow-up questions based on initial answer
 */
export async function multiHopQuery(tutorialId, question, maxHops = 2) {
  const results = [await ragQuery(tutorialId, question)]
  
  for (let hop = 1; hop < maxHops; hop++) {
    // Ask AI if follow-up is needed
    const followUpPrompt = `Based on this Q&A, is there a natural follow-up question that would deepen understanding?

Question: ${question}
Answer: ${results[results.length - 1].answer}

If yes, return JUST the follow-up question. If no, return "COMPLETE".`
    
    const followUp = await callAI(
      'You identify useful follow-up questions for educational content.',
      followUpPrompt
    )
    
    if (followUp.trim() === 'COMPLETE' || followUp.length > 200) {
      break
    }
    
    console.log(`  Follow-up question: ${followUp}`)
    results.push(await ragQuery(tutorialId, followUp.trim()))
  }
  
  return results
}

/**
 * Compare retrieval: text-only vs embedding-boosted
 * Useful for evaluating if embeddings help
 */
export async function compareRetrieval(tutorialId, question) {
  const tree = await loadSemanticTree(tutorialId)
  const queryEmbedding = await generateEmbedding(question)
  
  // Embedding-based search
  const embeddingResults = await hierarchicalSearch(tree, queryEmbedding)
  
  // Text-based search (keyword matching)
  const keywords = question.toLowerCase().split(/\s+/)
  const textResults = []
  
  function textSearch(node, ancestors = []) {
    const text = `${node.title} ${node.summary}`.toLowerCase()
    const matches = keywords.filter(kw => text.includes(kw)).length
    const score = matches / keywords.length
    
    if (score > 0.2) {
      textResults.push({
        node,
        score,
        path: ancestors.map(a => a.title)
      })
    }
    
    if (node.children) {
      for (const child of node.children) {
        textSearch(child, [...ancestors, node])
      }
    }
  }
  
  textSearch(tree)
  textResults.sort((a, b) => b.score - a.score)
  
  return {
    embeddingResults: embeddingResults.slice(0, 5).map(r => ({
      title: r.node.title,
      score: r.score
    })),
    textResults: textResults.slice(0, 5).map(r => ({
      title: r.node.title,
      score: r.score
    })),
    embeddingOnlyFinds: embeddingResults
      .filter(er => !textResults.some(tr => tr.node.id === er.node.id))
      .map(r => r.node.title),
    textOnlyFinds: textResults
      .filter(tr => !embeddingResults.some(er => er.node.id === tr.node.id))
      .map(r => r.node.title)
  }
}
