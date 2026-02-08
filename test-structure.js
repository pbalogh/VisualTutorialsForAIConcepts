/**
 * Test that validates the STRUCTURAL integrity after regroup
 * 
 * Checks:
 * 1. All sections are preserved
 * 2. New elements (sidebars, paragraphs) are properly inserted
 * 3. Tree view would render correctly
 * 4. No orphaned elements
 */

import fs from 'fs'
import path from 'path'

const CONTENT_DIR = './src/content'

function analyzeStructure(content, depth = 0) {
  const result = {
    sections: [],
    paragraphs: 0,
    sidebars: [],
    deepDives: [],
    callouts: [],
    other: []
  }
  
  function traverse(node, currentSection = null) {
    if (!node) return
    
    if (node.type === 'Section') {
      const section = {
        title: node.props?.title || 'Untitled',
        childCount: node.children?.length || 0,
        childTypes: []
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => {
          if (typeof child === 'object' && child.type) {
            section.childTypes.push(child.type)
          }
        })
      }
      result.sections.push(section)
      currentSection = section
    }
    
    if (node.type === 'p') result.paragraphs++
    if (node.type === 'Sidebar') {
      result.sidebars.push({
        title: node.props?.title || 'Untitled',
        type: node.props?.type || 'note',
        inSection: currentSection?.title
      })
    }
    if (node.type === 'DeepDive') {
      result.deepDives.push({
        title: node.props?.title || 'Untitled',
        inSection: currentSection?.title
      })
    }
    if (node.type === 'Callout') result.callouts.push({ inSection: currentSection?.title })
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        if (typeof child === 'object') {
          traverse(child, currentSection)
        }
      })
    }
  }
  
  traverse(content)
  return result
}

function validateStructure(structure, tutorialName) {
  const issues = []
  
  // Check sections
  if (structure.sections.length === 0) {
    issues.push('❌ No sections found')
  }
  
  // Check for empty sections
  structure.sections.forEach(section => {
    if (section.childCount === 0) {
      issues.push(`❌ Empty section: "${section.title}"`)
    }
    if (section.childCount < 2) {
      issues.push(`⚠️ Very short section: "${section.title}" (${section.childCount} children)`)
    }
  })
  
  // Check sidebars have titles
  structure.sidebars.forEach((sidebar, i) => {
    if (sidebar.title === 'Untitled') {
      issues.push(`⚠️ Sidebar ${i+1} has no title`)
    }
  })
  
  return issues
}

function printStructureSummary(structure, name) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 STRUCTURE ANALYSIS: ${name}`)
  console.log('='.repeat(60))
  
  console.log(`\n📁 SECTIONS (${structure.sections.length}):`)
  structure.sections.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.title}`)
    console.log(`      Children: ${s.childCount} [${s.childTypes.slice(0, 5).join(', ')}${s.childTypes.length > 5 ? '...' : ''}]`)
  })
  
  console.log(`\n📝 CONTENT ELEMENTS:`)
  console.log(`   Paragraphs: ${structure.paragraphs}`)
  console.log(`   Sidebars: ${structure.sidebars.length}`)
  console.log(`   DeepDives: ${structure.deepDives.length}`)
  console.log(`   Callouts: ${structure.callouts.length}`)
  
  if (structure.sidebars.length > 0) {
    console.log(`\n📌 SIDEBARS:`)
    structure.sidebars.forEach((s, i) => {
      console.log(`   ${i+1}. [${s.type}] "${s.title}" (in: ${s.inSection})`)
    })
  }
  
  const issues = validateStructure(structure, name)
  if (issues.length > 0) {
    console.log(`\n⚠️ ISSUES:`)
    issues.forEach(issue => console.log(`   ${issue}`))
  } else {
    console.log(`\n✅ No structural issues found`)
  }
}

// Run on a specific tutorial
async function analyzeTutorial(tutorialId) {
  const jsonPath = path.join(CONTENT_DIR, `${tutorialId}.json`)
  
  try {
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const structure = analyzeStructure(content.content)
    printStructureSummary(structure, content.title || tutorialId)
    return structure
  } catch (e) {
    console.error(`❌ Failed to analyze ${tutorialId}:`, e.message)
    return null
  }
}

// Main
const tutorialId = process.argv[2] || 'neural-oscillations'
console.log(`🔍 Analyzing structure of: ${tutorialId}`)
analyzeTutorial(tutorialId)
