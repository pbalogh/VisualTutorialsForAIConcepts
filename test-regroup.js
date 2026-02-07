/**
 * Test script for the regroup/rewrite functionality
 * 
 * Creates sample tutorial sections with annotations, runs the rewrite,
 * then has a critic evaluate the result.
 */

import { callAI } from './ai-config.js'

// Sample tutorial section with annotations
const sampleSection = {
  title: "How Neurons Communicate",
  originalText: `Neurons communicate through electrical signals called action potentials. When a neuron fires, it sends a signal down its axon to connect with other neurons. This process happens millions of times per second in your brain, allowing you to think, move, and perceive the world.`,
  annotations: [
    {
      type: 'question',
      content: 'About "action potentials": What exactly triggers an action potential? Is it like a switch that\'s either on or off?'
    },
    {
      type: 'answer',
      content: 'Yes! Action potentials are "all-or-nothing" events. When a neuron receives enough input to cross a threshold (about -55mV), it fires completely. Below threshold, nothing happens. This binary nature is why they\'re sometimes compared to digital signals.'
    },
    {
      type: 'question', 
      content: 'About "millions of times per second": That seems like a lot! How does the brain handle all that activity without overheating or getting confused?'
    },
    {
      type: 'answer',
      content: 'Great question! The brain uses several tricks: 1) Neurons don\'t all fire at once - they take turns in coordinated patterns. 2) Most signals are inhibitory, actually preventing firing. 3) The brain uses only about 20 watts of power - remarkably efficient! The coordination comes from rhythmic oscillations that organize when different groups fire.'
    }
  ]
}

// Another sample - more technical
const sampleSection2 = {
  title: "Matrix Multiplication",
  originalText: `To multiply two matrices A and B, we take the dot product of each row of A with each column of B. The result is a new matrix where each element represents how much the corresponding row and column "align" with each other.`,
  annotations: [
    {
      type: 'question',
      content: 'About "dot product": I\'ve heard this term but I\'m not sure what it actually computes. What does the dot product tell us?'
    },
    {
      type: 'answer',
      content: 'The dot product measures how much two vectors point in the same direction. If they\'re parallel, you get a large positive number. If perpendicular, you get zero. If opposite, you get a large negative number. It\'s like asking "how similar are these two directions?"'
    }
  ]
}

async function testRewrite(section) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📝 Testing section: "${section.title}"`)
  console.log('='.repeat(60))
  
  console.log('\n📄 ORIGINAL TEXT:')
  console.log(section.originalText)
  
  console.log('\n📌 ANNOTATIONS TO INCORPORATE:')
  section.annotations.forEach((ann, i) => {
    console.log(`  ${i+1}. [${ann.type}] ${ann.content.slice(0, 80)}...`)
  })
  
  // Build the rewrite prompt (same as in annotation-server.js)
  const annSummary = section.annotations.map((a, i) => 
    `${i+1}. [${a.type}]: "${a.content}"`
  ).join('\n')
  
  const rewritePrompt = `You are improving an educational tutorial section by incorporating reader feedback.

SECTION TITLE: "${section.title}"

CURRENT SECTION TEXT:
${section.originalText}

READER ANNOTATIONS (questions/explanations that were added):
${annSummary}

TASK: Rewrite the section text to incorporate the insights from these annotations.

CRITICAL INSTRUCTIONS:
1. DON'T just insert annotation text - truly WEAVE the insights into the narrative
2. Use smooth transitions between concepts - no jarring jumps
3. Introduce new concepts BEFORE using them (e.g., define "dot product" before explaining what it measures)
4. Maintain a consistent voice and flow throughout
5. The reader should feel like they're reading a polished textbook, not patched-together explanations
6. Keep the same overall structure and length - don't make it 3x longer
7. Don't add new subsections, headers, or bullet points

Return ONLY the rewritten text (plain prose, no JSON, no markdown).`

  console.log('\n🤖 Calling AI to rewrite...')
  
  const rewrittenText = await callAI(
    'You are an expert educational content editor. Your specialty is seamlessly integrating clarifications into prose without making it feel stitched together.',
    rewritePrompt
  )
  
  console.log('\n✨ REWRITTEN TEXT:')
  console.log(rewrittenText.trim())
  
  // Now have a critic evaluate
  console.log('\n🔍 CRITIC EVALUATION:')
  
  const criticPrompt = `You are a harsh but fair editor evaluating whether a rewrite successfully incorporated reader feedback.

ORIGINAL TEXT:
${section.originalText}

ANNOTATIONS THAT NEEDED TO BE INCORPORATED:
${annSummary}

REWRITTEN TEXT:
${rewrittenText}

EVALUATE:
1. Were ALL annotation insights incorporated? List any that were missed.
2. Does the rewritten text flow naturally, or does it feel like patches were bolted on?
3. Is any important information from the original lost?
4. Would a reader still need the annotations, or is the text now self-sufficient?

Give a score from 1-10 and specific feedback. Be critical - don't give a high score unless truly deserved.

Format:
SCORE: X/10
MISSED INSIGHTS: [list any]
FLOW: [assessment]
LOST INFO: [any original content that's missing]
SELF-SUFFICIENT: [yes/no and why]
SPECIFIC ISSUES: [bullet points]`

  const critique = await callAI(
    'You are a demanding editor who holds high standards for educational content.',
    criticPrompt
  )
  
  console.log(critique.trim())
  
  return { section: section.title, rewrittenText, critique }
}

async function runTests() {
  console.log('🧪 REGROUP REWRITE TEST SUITE')
  console.log('Testing whether AI properly incorporates annotations into tutorial text\n')
  
  const results = []
  
  try {
    results.push(await testRewrite(sampleSection))
    results.push(await testRewrite(sampleSection2))
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    
    for (const r of results) {
      // Extract score from critique
      const scoreMatch = r.critique.match(/SCORE:\s*(\d+)\/10/)
      const score = scoreMatch ? scoreMatch[1] : '?'
      console.log(`  ${r.section}: ${score}/10`)
    }
    
  } catch (e) {
    console.error('❌ Test failed:', e.message)
  }
}

runTests()
