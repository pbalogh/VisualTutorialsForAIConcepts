/**
 * Test script for STRUCTURED regroup approach
 * 
 * Instead of rewriting entire sections, AI returns specific edits:
 * - "insert_after": Add new paragraph after a specific sentence
 * - "expand": Add sentences to an existing paragraph
 * - "sidebar": Add a sidebar callout for tangential info
 * - "split_and_insert": Break a paragraph and insert between
 */

import { callAI } from './ai-config.js'

// Sample section with more realistic structure
const sampleSection = {
  title: "How Neurons Communicate",
  paragraphs: [
    "Neurons communicate through electrical signals called action potentials. When a neuron fires, it sends a signal down its axon to connect with other neurons.",
    "This process happens millions of times per second in your brain, allowing you to think, move, and perceive the world."
  ],
  annotations: [
    {
      type: 'question',
      nearText: 'action potentials',
      content: 'What exactly triggers an action potential? Is it like a switch?'
    },
    {
      type: 'answer', 
      content: 'Yes! Action potentials are "all-or-nothing" events. When a neuron receives enough input to cross a threshold (about -55mV), it fires completely. Below threshold, nothing happens.'
    },
    {
      type: 'question',
      nearText: 'millions of times per second',
      content: 'How does the brain handle all that activity without getting overwhelmed?'
    },
    {
      type: 'answer',
      content: 'Neurons don\'t all fire at once - they take turns in coordinated patterns via rhythmic oscillations. Most signals are actually inhibitory. The brain uses only 20 watts of power.'
    }
  ]
}

async function testStructuredRewrite(section) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📝 Testing: "${section.title}"`)
  console.log('='.repeat(60))
  
  console.log('\n📄 ORIGINAL PARAGRAPHS:')
  section.paragraphs.forEach((p, i) => console.log(`  [${i}] ${p}`))
  
  console.log('\n📌 ANNOTATIONS:')
  section.annotations.forEach((a, i) => console.log(`  ${i+1}. [${a.type}] ${a.content.slice(0, 60)}...`))
  
  const prompt = `You are improving an educational tutorial by incorporating reader feedback.

SECTION: "${section.title}"

CURRENT PARAGRAPHS:
${section.paragraphs.map((p, i) => `[${i}] ${p}`).join('\n')}

ANNOTATIONS TO INCORPORATE:
${section.annotations.map((a, i) => `${i+1}. [${a.type}]${a.nearText ? ` (near "${a.nearText}")` : ''}: ${a.content}`).join('\n')}

Your job is to decide HOW to incorporate each annotation's insight. Return a JSON array of edits.

AVAILABLE EDIT TYPES:
1. "expand" - Add 1-2 sentences to an existing paragraph
   { "type": "expand", "paragraphIndex": 0, "addSentences": "New sentences to add." }

2. "insert_paragraph" - Add a new paragraph after an existing one
   { "type": "insert_paragraph", "afterIndex": 0, "text": "New paragraph text." }

3. "sidebar" - Add a sidebar for tangential/advanced info (won't interrupt flow)
   { "type": "sidebar", "afterIndex": 0, "title": "Why This Matters", "text": "Sidebar content..." }

4. "split_and_insert" - Break a paragraph at a point and insert between
   { "type": "split_and_insert", "paragraphIndex": 0, "splitAfter": "sentence to split after.", "insertText": "New text between." }

GUIDELINES:
- Keep paragraphs SHORT (3-4 sentences max)
- Use sidebars for technical details that might overwhelm casual readers
- Preserve specific numbers and values from annotations
- Don't repeat information that's already there

Return ONLY a JSON array of edits, no explanation.`

  console.log('\n🤖 Calling AI for structured edits...')
  
  const response = await callAI(
    'You are an expert editor who makes precise, surgical improvements to educational content.',
    prompt
  )
  
  console.log('\n📋 AI RESPONSE (raw):')
  console.log(response.slice(0, 1000))
  
  // Try to parse the edits
  let edits
  try {
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
    edits = JSON.parse(jsonStr.trim())
  } catch (e) {
    console.log('❌ Failed to parse:', e.message)
    return
  }
  
  console.log('\n✨ PARSED EDITS:')
  edits.forEach((edit, i) => {
    console.log(`  ${i+1}. [${edit.type}]`, JSON.stringify(edit).slice(0, 100) + '...')
  })
  
  // Apply edits (simplified - real version would be more careful)
  console.log('\n📝 RESULT AFTER APPLYING EDITS:')
  let result = [...section.paragraphs]
  let insertions = [] // track insertions to adjust indices
  
  for (const edit of edits) {
    if (edit.type === 'expand') {
      result[edit.paragraphIndex] += ' ' + edit.addSentences
    } else if (edit.type === 'insert_paragraph') {
      // Find adjusted index
      const adjIndex = edit.afterIndex + 1 + insertions.filter(i => i <= edit.afterIndex).length
      result.splice(adjIndex, 0, edit.text)
      insertions.push(edit.afterIndex)
    } else if (edit.type === 'sidebar') {
      const adjIndex = edit.afterIndex + 1 + insertions.filter(i => i <= edit.afterIndex).length
      result.splice(adjIndex, 0, `[SIDEBAR: ${edit.title}] ${edit.text}`)
      insertions.push(edit.afterIndex)
    }
  }
  
  result.forEach((p, i) => console.log(`  [${i}] ${p}\n`))
  
  return { edits, result }
}

async function run() {
  console.log('🧪 STRUCTURED REGROUP TEST')
  console.log('Testing edit-based approach instead of full rewrite\n')
  
  try {
    await testStructuredRewrite(sampleSection)
  } catch (e) {
    console.error('❌ Error:', e.message)
  }
}

run()
