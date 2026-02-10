import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as d3 from 'd3'

// ─── Concept Dictionary ─────────────────────────────────────────────────────
// Cross-cutting concepts that span multiple tutorials.
// Each concept has keywords to match against tutorial content.
const CONCEPT_DICTIONARY = [
  {
    id: 'compositionality',
    label: 'Compositionality',
    keywords: ['compositionality', 'compositional', 'compose', 'composition of', 'tensor product', 'algebraic structure'],
    category: 'theory',
  },
  {
    id: 'embeddings',
    label: 'Embeddings & Representations',
    keywords: ['embedding', 'vector space', 'representation', 'latent space', 'encoding', 'disentangled'],
    category: 'ml',
  },
  {
    id: 'neural-networks',
    label: 'Neural Network Architecture',
    keywords: ['neural network', 'transformer', 'attention mechanism', 'deep learning', 'architecture', 'layers', 'backpropagation'],
    category: 'ml',
  },
  {
    id: 'rag',
    label: 'RAG & Retrieval',
    keywords: ['retrieval augmented', 'RAG', 'retrieval', 'knowledge base', 'grounding', 'external knowledge'],
    category: 'applied',
  },
  {
    id: 'knowledge-graphs',
    label: 'Knowledge Graphs',
    keywords: ['knowledge graph', 'knowledge base', 'ATOMIC', 'ConceptNet', 'ontology', 'triple', 'entity-relation'],
    category: 'data',
  },
  {
    id: 'linear-algebra',
    label: 'Linear Algebra',
    keywords: ['matrix', 'vector', 'eigenvalue', 'linear transformation', 'projection', 'dot product', 'basis', 'span', 'rank'],
    category: 'math',
  },
  {
    id: 'category-theory',
    label: 'Category Theory',
    keywords: ['category theory', 'functor', 'morphism', 'natural transformation', 'adjunction', 'monad', 'yoneda', 'limit', 'colimit'],
    category: 'math',
  },
  {
    id: 'group-theory',
    label: 'Group Theory & Symmetry',
    keywords: ['group theory', 'symmetry', 'permutation', 'isomorphism', 'homomorphism', 'abelian', 'dihedral', 'cyclic group'],
    category: 'math',
  },
  {
    id: 'operators-transforms',
    label: 'Operators & Transformations',
    keywords: ['operator', 'transformation', 'state change', 'ATRANS', 'PTRANS', 'MTRANS', 'schankian', 'primitive'],
    category: 'theory',
  },
  {
    id: 'nlp-semantics',
    label: 'NLP & Semantics',
    keywords: ['semantics', 'NLP', 'natural language', 'parsing', 'semantic role', 'event semantics', 'linguistic'],
    category: 'applied',
  },
  {
    id: 'causality',
    label: 'Causality & Reasoning',
    keywords: ['causal', 'causation', 'counterfactual', 'intervention', 'cause and effect', 'force dynamics', 'reasoning'],
    category: 'theory',
  },
  {
    id: 'training-strategies',
    label: 'Training Strategies',
    keywords: ['contrastive learning', 'curriculum learning', 'self-supervised', 'training signal', 'loss function', 'optimization', 'gradient descent'],
    category: 'ml',
  },
  {
    id: 'interpretability',
    label: 'Interpretability & Probing',
    keywords: ['interpretability', 'mechanistic', 'probing', 'SAE', 'sparse autoencoder', 'feature', 'circuit', 'superposition'],
    category: 'ml',
  },
  {
    id: 'topology',
    label: 'Topology & TDA',
    keywords: ['topology', 'topological', 'persistent homology', 'betti number', 'simplicial', 'manifold'],
    category: 'math',
  },
  {
    id: 'information-theory',
    label: 'Information Theory',
    keywords: ['information theory', 'entropy', 'compression', 'MDL', 'minimum description length', 'information bottleneck', 'mutual information'],
    category: 'math',
  },
  {
    id: 'cognitive-science',
    label: 'Cognitive Science',
    keywords: ['cognitive', 'cognition', 'prototype', 'conceptual', 'mental model', 'analogy', 'structure mapping', 'schema'],
    category: 'theory',
  },
  {
    id: 'biology-biochem',
    label: 'Biology & Biochemistry',
    keywords: ['peptide', 'protein', 'amino acid', 'biological', 'molecular', 'enzyme', 'receptor', 'therapeutic'],
    category: 'science',
  },
  {
    id: 'neuroscience',
    label: 'Neuroscience',
    keywords: ['neuroscience', 'neural oscillation', 'hippocampus', 'memory consolidation', 'brain', 'neuron', 'synaptic'],
    category: 'science',
  },
  {
    id: 'state-machines',
    label: 'State Machines & Automata',
    keywords: ['state machine', 'automaton', 'automata', 'STRIPS', 'precondition', 'postcondition', 'transition'],
    category: 'theory',
  },
  {
    id: 'language-learning',
    label: 'Human Language Learning',
    keywords: ['hungarian', 'language learning', 'pronunciation', 'grammar', 'vowel harmony', 'agglutination', 'conjugation'],
    category: 'language',
  },
  {
    id: 'statistics',
    label: 'Statistics & Regression',
    keywords: ['regression', 'least squares', 'correlation', 'statistical', 'variance', 'covariance', 'fit'],
    category: 'math',
  },
  {
    id: 'rethinking-nn',
    label: 'Rethinking Neural Networks',
    keywords: ['rethinking', 'beyond transformers', 'alternative architecture', 'inductive bias', 'structural prior', 'neuro-symbolic'],
    category: 'ml',
  },
  {
    id: 'universality',
    label: 'Universality & Cross-Domain',
    keywords: ['universal', 'cross-domain', 'cross-lingual', 'domain transfer', 'generalization', 'invariant'],
    category: 'theory',
  },
  {
    id: 'evaluation',
    label: 'Evaluation & Benchmarks',
    keywords: ['benchmark', 'evaluation', 'metric', 'SCAN', 'narrative cloze', 'test set', 'accuracy'],
    category: 'applied',
  },
]

const CATEGORY_COLORS = {
  math: '#818cf8',     // indigo
  ml: '#f472b6',       // pink
  theory: '#34d399',   // emerald
  applied: '#fbbf24',  // amber
  science: '#22d3ee',  // cyan
  data: '#fb923c',     // orange
  language: '#a78bfa',  // violet
}

// ─── Concept Extraction ─────────────────────────────────────────────────────

function extractTextFromJson(obj) {
  if (typeof obj === 'string') return obj + ' '
  if (Array.isArray(obj)) return obj.map(extractTextFromJson).join(' ')
  if (obj && typeof obj === 'object') {
    return Object.values(obj).map(extractTextFromJson).join(' ')
  }
  return ''
}

function matchConcepts(tutorialText, concepts) {
  const lower = tutorialText.toLowerCase()
  const matched = []
  for (const concept of concepts) {
    const score = concept.keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw.toLowerCase(), 'gi')
      const matches = lower.match(regex)
      return acc + (matches ? matches.length : 0)
    }, 0)
    if (score >= 2) { // at least 2 keyword hits
      matched.push({ conceptId: concept.id, score })
    }
  }
  return matched
}

async function loadTutorialContent(id) {
  try {
    // Filter out tree/quiz/semantic-tree variants
    if (id.includes('-tree') || id.includes('-quiz') || id.includes('semantic-tree')) {
      return null
    }
    const mod = await import(`../content/${id}.json`)
    return mod.default || mod
  } catch {
    return null
  }
}

// ─── Force Graph Component ──────────────────────────────────────────────────

function ForceGraph({ data, width, height, onNodeClick }) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)

  useEffect(() => {
    if (!data || !data.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    // Simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(d => 120 / (d.strength || 1)))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'concept' ? -300 : -150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.type === 'concept' ? d.radius + 10 : 20))

    simulationRef.current = simulation

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => Math.max(1, d.strength * 0.5))

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Concept nodes (large circles)
    node.filter(d => d.type === 'concept')
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.15)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)

    node.filter(d => d.type === 'concept')
      .append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', d => d.color)
      .attr('font-size', d => Math.max(10, d.radius * 0.4))
      .attr('font-weight', 600)
      .style('pointer-events', 'none')

    // Tutorial nodes (small circles with icon)
    node.filter(d => d.type === 'tutorial')
      .append('circle')
      .attr('r', 14)
      .attr('fill', '#1e293b')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.5)

    node.filter(d => d.type === 'tutorial')
      .append('text')
      .text(d => d.icon || '📄')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .style('pointer-events', 'none')

    // Tutorial labels (hidden by default, shown on hover)
    const labels = node.filter(d => d.type === 'tutorial')
      .append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .attr('fill', '#e2e8f0')
      .attr('font-size', 10)
      .attr('font-weight', 500)
      .style('pointer-events', 'none')
      .style('opacity', 0)

    // Hover effects
    node.on('mouseover', function(event, d) {
      // Highlight connected links
      link.attr('stroke-opacity', l =>
        (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.1
      ).attr('stroke', l =>
        (l.source.id === d.id || l.target.id === d.id) ? '#818cf8' : '#475569'
      )
      // Show label for tutorials
      d3.select(this).select('text:last-of-type').style('opacity', 1)
      // Dim unconnected nodes
      const connectedIds = new Set()
      data.links.forEach(l => {
        if (l.source.id === d.id) connectedIds.add(l.target.id)
        if (l.target.id === d.id) connectedIds.add(l.source.id)
      })
      connectedIds.add(d.id)
      node.style('opacity', n => connectedIds.has(n.id) ? 1 : 0.2)
    })
    .on('mouseout', function() {
      link.attr('stroke-opacity', 0.3).attr('stroke', '#475569')
      labels.style('opacity', 0)
      node.style('opacity', 1)
    })
    .on('click', (event, d) => onNodeClick?.(d))

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [data, width, height, onNodeClick])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#0f172a', borderRadius: 12 }}
    />
  )
}

// ─── Info Panel ─────────────────────────────────────────────────────────────

function InfoPanel({ node, graphData, onClose }) {
  if (!node) return null

  const connectedLinks = graphData.links.filter(
    l => l.source.id === node.id || l.target.id === node.id
  )
  const connectedNodes = connectedLinks.map(l =>
    l.source.id === node.id
      ? graphData.nodes.find(n => n.id === l.target.id)
      : graphData.nodes.find(n => n.id === l.source.id)
  ).filter(Boolean)

  const tutorials = connectedNodes.filter(n => n.type === 'tutorial')
  const concepts = connectedNodes.filter(n => n.type === 'concept')

  return (
    <div className="absolute top-4 right-4 w-80 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-5 shadow-2xl z-10">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
      >✕</button>

      <div className="flex items-center gap-2 mb-3">
        {node.type === 'tutorial' && <span className="text-xl">{node.icon}</span>}
        <h3 className="text-lg font-bold text-white">{node.label}</h3>
      </div>

      {node.type === 'concept' && (
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: node.color + '30', color: node.color }}
        >
          {node.category}
        </span>
      )}

      {node.type === 'tutorial' && node.tutorialId && (
        <Link
          to={`/tutorial/${node.tutorialId}`}
          className="inline-block mb-3 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Open Tutorial →
        </Link>
      )}

      {tutorials.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-slate-300 mb-1.5">
            📚 Related Tutorials ({tutorials.length})
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {tutorials.map(t => (
              <Link
                key={t.id}
                to={`/tutorial/${t.tutorialId}`}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-700/50 text-slate-200 text-sm transition-colors"
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {concepts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-1.5">
            🔗 Connected Concepts ({concepts.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map(c => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: c.color + '20', color: c.color }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Legend (Interactive Category Filter) ────────────────────────────────────

function Legend({ activeCategories, onToggleCategory }) {
  return (
    <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-xl p-4 z-10">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Categories <span className="text-slate-500 normal-case font-normal">(click to filter)</span>
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
          const isActive = activeCategories.size === 0 || activeCategories.has(cat)
          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded transition-all text-left ${
                isActive ? 'opacity-100' : 'opacity-30'
              } hover:opacity-100`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                style={{
                  backgroundColor: color,
                  transform: isActive ? 'scale(1)' : 'scale(0.7)',
                  boxShadow: isActive ? `0 0 8px ${color}60` : 'none',
                }}
              />
              <span className="text-xs text-slate-300 capitalize">{cat}</span>
            </button>
          )
        })}
      </div>
      {activeCategories.size > 0 && (
        <button
          onClick={() => onToggleCategory(null)}
          className="mt-2 pt-2 border-t border-slate-600 text-xs text-indigo-400 hover:text-indigo-300 transition-colors w-full text-left"
        >
          ✕ Clear filters
        </button>
      )}
      <div className="mt-2 pt-2 border-t border-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500" />
          <span className="text-xs text-slate-300">Tutorial</span>
        </div>
      </div>
    </div>
  )
}

// ─── Suggested Concepts Panel ───────────────────────────────────────────────

const SUGGESTED_CONCEPTS = [
  { id: 'future-of-ai', label: 'Future of AI', keywords: ['future', 'AGI', 'artificial general', 'scaling', 'emergent', 'next generation', 'frontier'], category: 'applied', description: 'Where is AI heading? Scaling laws, emergent capabilities, AGI timelines' },
  { id: 'ontology', label: 'Ontology', keywords: ['ontology', 'ontological', 'being', 'existence', 'entity type', 'taxonomy', 'classification', 'is-a'], category: 'theory', description: 'The study of what exists — entity types, taxonomies, being' },
  { id: 'consciousness', label: 'Consciousness & Qualia', keywords: ['consciousness', 'qualia', 'subjective experience', 'sentience', 'phenomenal', 'awareness'], category: 'science', description: 'Hard problem of consciousness, qualia, and machine sentience' },
  { id: 'emergence', label: 'Emergence & Complexity', keywords: ['emergence', 'emergent', 'complex system', 'self-organization', 'phase transition', 'critical'], category: 'theory', description: 'How simple rules create complex behavior — from neurons to societies' },
  { id: 'game-theory', label: 'Game Theory & Strategy', keywords: ['game theory', 'nash equilibrium', 'strategy', 'payoff', 'zero-sum', 'cooperation', 'prisoner'], category: 'math', description: 'Strategic interaction, equilibria, cooperation vs competition' },
  { id: 'philosophy-of-language', label: 'Philosophy of Language', keywords: ['philosophy of language', 'reference', 'meaning', 'truth condition', 'speech act', 'pragmatic', 'wittgenstein', 'denotation'], category: 'theory', description: 'What do words really mean? Reference, truth, speech acts' },
  { id: 'evolutionary-dynamics', label: 'Evolutionary Dynamics', keywords: ['evolution', 'evolutionary', 'fitness', 'selection', 'mutation', 'adaptation', 'genetic', 'darwinian'], category: 'science', description: 'Natural selection, fitness landscapes, evolutionary algorithms' },
  { id: 'quantum-computing', label: 'Quantum Computing', keywords: ['quantum', 'qubit', 'superposition', 'entanglement', 'quantum gate', 'quantum circuit', 'decoherence'], category: 'math', description: 'Qubits, superposition, entanglement, quantum algorithms' },
  { id: 'network-science', label: 'Network Science', keywords: ['network', 'graph theory', 'small world', 'scale-free', 'centrality', 'community detection', 'degree distribution'], category: 'math', description: 'Small worlds, scale-free networks, community structure' },
  { id: 'phenomenology', label: 'Phenomenology', keywords: ['phenomenology', 'husserl', 'heidegger', 'intentionality', 'lifeworld', 'embodied', 'dasein'], category: 'theory', description: 'First-person experience, intentionality, embodied cognition' },
  { id: 'economics-of-ai', label: 'Economics of AI', keywords: ['economics', 'labor market', 'automation', 'productivity', 'market', 'cost', 'revenue', 'business model', 'monetize'], category: 'applied', description: 'Automation economics, AI business models, labor displacement' },
  { id: 'ethics-alignment', label: 'AI Ethics & Alignment', keywords: ['ethics', 'alignment', 'safety', 'bias', 'fairness', 'value alignment', 'RLHF', 'reward hacking'], category: 'applied', description: 'Value alignment, safety, fairness, RLHF, reward hacking' },
  { id: 'compression', label: 'Compression as Intelligence', keywords: ['compression', 'Kolmogorov', 'Solomonoff', 'minimum description', 'Occam', 'simplicity', 'lossless', 'lossy'], category: 'theory', description: 'Intelligence as compression — Kolmogorov, MDL, Occam\'s razor' },
  { id: 'music-math', label: 'Music & Mathematics', keywords: ['music', 'harmony', 'frequency', 'interval', 'chord', 'rhythm', 'fourier', 'overtone', 'scale'], category: 'math', description: 'Fourier transforms of sound, harmonic series, musical structure' },
  { id: 'language-universals', label: 'Linguistic Universals', keywords: ['universal grammar', 'typology', 'linguistic universal', 'cross-linguistic', 'Greenberg', 'language family', 'syntax universal'], category: 'language', description: 'What all languages share — Greenberg universals, typology' },
  { id: 'embodied-cognition', label: 'Embodied Cognition', keywords: ['embodied', 'grounded cognition', 'sensorimotor', 'body', 'situated', 'enactive', 'affordance'], category: 'science', description: 'Thinking through the body — sensorimotor grounding, enactivism' },
]

function SuggestedConceptsPanel({ activeSuggestions, onToggleSuggestion, isOpen, onToggleOpen }) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-3 z-10 hover:border-indigo-500/50 transition-colors"
      >
        <span className="text-sm text-indigo-400">💡 Explore More Concepts</span>
      </button>
    )
  }

  return (
    <div className="absolute top-4 right-4 w-80 max-h-[70vh] bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl z-10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-600">
        <h4 className="text-sm font-semibold text-indigo-400">
          💡 Explore More Concepts
        </h4>
        <button
          onClick={onToggleOpen}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >✕</button>
      </div>
      <p className="px-4 pt-2 text-xs text-slate-400">
        Click to add concepts to the graph. These scan your existing tutorials for hidden connections.
      </p>
      <div className="overflow-y-auto p-4 space-y-2 flex-1">
        {SUGGESTED_CONCEPTS.map(concept => {
          const isActive = activeSuggestions.has(concept.id)
          return (
            <button
              key={concept.id}
              onClick={() => onToggleSuggestion(concept)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isActive
                  ? 'border-indigo-500/50 bg-indigo-500/10'
                  : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {concept.label}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: (CATEGORY_COLORS[concept.category] || '#94a3b8') + '20',
                    color: CATEGORY_COLORS[concept.category] || '#94a3b8',
                  }}
                >
                  {concept.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{concept.description}</p>
              {isActive && (
                <span className="text-xs text-indigo-400 mt-1 inline-block">✓ Active — click to remove</span>
              )}
            </button>
          )
        })}
      </div>
      {activeSuggestions.size > 0 && (
        <div className="p-3 border-t border-slate-600">
          <span className="text-xs text-slate-400">{activeSuggestions.size} concept{activeSuggestions.size > 1 ? 's' : ''} added — hit Refresh to re-scan</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

// Tutorial metadata — we need this to know which files to scan
const TUTORIAL_FILES = [
  { id: 'group-theory-puzzles', icon: '🔺' },
  { id: 'lead-lag-correlation', icon: '📈' },
  { id: 'vector-projection', icon: '↗️' },
  { id: 'matrix-discovery', icon: '🔢' },
  { id: 'matrix-from-vectors', icon: '🎯' },
  { id: 'least-squares', icon: '📊' },
  { id: 'schankian-paper-draft', icon: '📝' },
  { id: 'rotate-paper', icon: '🔄' },
  { id: 'neural-oscillations', icon: '🧠' },
  { id: 'brainstorm-09-knn-linguistic-anchors', icon: '⚓' },
  { id: 'brainstorm-23-differentiable-state-machines', icon: '⚙️' },
  { id: 'brainstorm-06-tensor-products-fail', icon: '💥' },
  { id: 'brainstorm-07-structure-mapping', icon: '🔗' },
  { id: 'brainstorm-11-talmys-force-dynamics', icon: '💪' },
  { id: 'brainstorm-15-atomic-relations', icon: '⚛️' },
  { id: 'hungarian-basics', icon: '🇭🇺' },
  { id: 'peptides-tutorial', icon: '🧬' },
  { id: 'how-peptides-can-be-used-in-a-way-that-resembles-p', icon: '💊' },
  { id: 'category-theory', icon: '🔀' },
  { id: 'implicit-explicit-enrichment', icon: '🔍' },
  { id: 'mining-sae-operators', icon: '⛏️' },
]

export default function ImplicationsGraph() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 })
  const [activeCategories, setActiveCategories] = useState(new Set())
  const [activeSuggestions, setActiveSuggestions] = useState(new Set())
  const [suggestedConceptsMap, setSuggestedConceptsMap] = useState(new Map())
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef(null)

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: Math.max(500, window.innerHeight - 160)
        })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const buildGraph = useCallback(async () => {
    setLoading(true)
    setSelectedNode(null)

    // Merge base concepts with active suggestions
    const allConcepts = [...CONCEPT_DICTIONARY]
    for (const [id, concept] of suggestedConceptsMap) {
      if (activeSuggestions.has(id)) {
        allConcepts.push(concept)
      }
    }

    const tutorialConcepts = [] // { tutorialId, title, icon, concepts: [{conceptId, score}] }

    for (const tut of TUTORIAL_FILES) {
      const content = await loadTutorialContent(tut.id)
      if (!content) continue
      const text = extractTextFromJson(content)
      const title = content.title || tut.id
      const matched = matchConcepts(text, allConcepts)
      if (matched.length > 0) {
        tutorialConcepts.push({
          tutorialId: tut.id,
          title,
          icon: tut.icon,
          concepts: matched,
        })
      }
    }

    // Build graph nodes
    const nodes = []
    const links = []
    const conceptCounts = {} // conceptId → number of tutorials mentioning it

    for (const tc of tutorialConcepts) {
      for (const m of tc.concepts) {
        conceptCounts[m.conceptId] = (conceptCounts[m.conceptId] || 0) + 1
      }
    }

    // Add concept nodes (only if referenced by 1+ tutorials for suggested, 2+ for base)
    for (const concept of allConcepts) {
      const count = conceptCounts[concept.id] || 0
      const isSuggested = activeSuggestions.has(concept.id)
      const minCount = isSuggested ? 1 : 2
      if (count >= minCount) {
        nodes.push({
          id: `concept:${concept.id}`,
          type: 'concept',
          label: concept.label,
          category: concept.category,
          color: CATEGORY_COLORS[concept.category] || '#94a3b8',
          radius: 20 + count * 6,
          count,
          isSuggested,
        })
      }
    }

    // Add tutorial nodes
    for (const tc of tutorialConcepts) {
      // Only add if connected to at least one included concept
      const validConcepts = tc.concepts.filter(m => conceptCounts[m.conceptId] >= 2)
      if (validConcepts.length === 0) continue

      nodes.push({
        id: `tutorial:${tc.tutorialId}`,
        type: 'tutorial',
        tutorialId: tc.tutorialId,
        label: tc.title,
        icon: tc.icon,
      })

      for (const m of validConcepts) {
        links.push({
          source: `tutorial:${tc.tutorialId}`,
          target: `concept:${m.conceptId}`,
          strength: Math.min(m.score, 10),
        })
      }
    }

    setGraphData({ nodes, links })
    setLoading(false)
  }, [activeSuggestions, suggestedConceptsMap])

  useEffect(() => {
    buildGraph()
  }, [buildGraph])

  // Category filter toggle
  const handleToggleCategory = useCallback((cat) => {
    if (cat === null) {
      setActiveCategories(new Set())
      return
    }
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Suggested concept toggle
  const handleToggleSuggestion = useCallback((concept) => {
    setActiveSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(concept.id)) {
        next.delete(concept.id)
      } else {
        next.add(concept.id)
      }
      return next
    })
    setSuggestedConceptsMap(prev => {
      const next = new Map(prev)
      next.set(concept.id, concept)
      return next
    })
  }, [])

  // Filter graph data based on active categories
  const filteredGraphData = React.useMemo(() => {
    if (!graphData || activeCategories.size === 0) return graphData

    const visibleConceptIds = new Set(
      graphData.nodes
        .filter(n => n.type === 'concept' && activeCategories.has(n.category))
        .map(n => n.id)
    )

    // Include tutorials connected to visible concepts
    const visibleTutorialIds = new Set()
    graphData.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target
      if (visibleConceptIds.has(targetId)) visibleTutorialIds.add(sourceId)
      if (visibleConceptIds.has(sourceId)) visibleTutorialIds.add(targetId)
    })

    const allVisibleIds = new Set([...visibleConceptIds, ...visibleTutorialIds])
    const filteredNodes = graphData.nodes.filter(n => allVisibleIds.has(n.id))
    const filteredLinks = graphData.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target
      return allVisibleIds.has(sourceId) && allVisibleIds.has(targetId)
    })

    return { nodes: filteredNodes, links: filteredLinks }
  }, [graphData, activeCategories])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Tutorials
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            🌐 Implications Cloud
          </h1>
          <span className="text-slate-500 text-sm">
            Cross-cutting concepts across all tutorials
          </span>
        </div>
        <button
          onClick={buildGraph}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              Scanning...
            </>
          ) : (
            <>🔄 Refresh</>
          )}
        </button>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="relative px-4 py-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-slate-800/90 backdrop-blur-sm px-8 py-6 rounded-2xl border border-slate-600 text-center">
              <div className="text-4xl mb-3 animate-pulse">🔍</div>
              <p className="text-slate-200 font-medium">Scanning tutorials for concepts...</p>
              <p className="text-slate-400 text-sm mt-1">Analyzing content across {TUTORIAL_FILES.length} tutorials</p>
            </div>
          </div>
        )}

        {filteredGraphData && (
          <ForceGraph
            data={filteredGraphData}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={setSelectedNode}
          />
        )}

        <Legend
          activeCategories={activeCategories}
          onToggleCategory={handleToggleCategory}
        />

        {selectedNode ? (
          <InfoPanel
            node={selectedNode}
            graphData={filteredGraphData || { nodes: [], links: [] }}
            onClose={() => setSelectedNode(null)}
          />
        ) : (
          <SuggestedConceptsPanel
            activeSuggestions={activeSuggestions}
            onToggleSuggestion={handleToggleSuggestion}
            isOpen={showSuggestions}
            onToggleOpen={() => setShowSuggestions(prev => !prev)}
          />
        )}

        {/* Stats */}
        {filteredGraphData && !loading && (
          <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-3 z-10">
            <div className="text-xs text-slate-400 space-y-1">
              <div><span className="text-white font-medium">{filteredGraphData.nodes.filter(n => n.type === 'concept').length}</span> concepts{activeCategories.size > 0 ? ' (filtered)' : ''}</div>
              <div><span className="text-white font-medium">{filteredGraphData.nodes.filter(n => n.type === 'tutorial').length}</span> tutorials</div>
              <div><span className="text-white font-medium">{filteredGraphData.links.length}</span> connections</div>
              {activeSuggestions.size > 0 && (
                <div><span className="text-indigo-400 font-medium">+{activeSuggestions.size}</span> suggested</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="px-6 pb-6 text-center text-slate-500 text-sm">
        Drag nodes to rearrange • Scroll to zoom • Click nodes for details • Hover to highlight connections
      </div>
    </div>
  )
}
