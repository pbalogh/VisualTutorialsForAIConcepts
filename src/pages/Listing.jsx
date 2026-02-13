import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../components/SharedUI.jsx'

// Modal for creating a new tutorial
function CreateTutorialModal({ isOpen, onClose }) {
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:5190/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate tutorial')
      }
      
      const data = await response.json()
      onClose()
      setTopic('')
      // Navigate to the new tutorial
      navigate(`/tutorial/${data.tutorialId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>✨</span> Create New Tutorial
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            AI will generate an interactive tutorial based on your topic
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to learn about?
          </label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., How gradient descent works, The basics of Fourier transforms, Understanding attention mechanisms in transformers..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
            rows={4}
            disabled={isGenerating}
            autoFocus
          />
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim() || isGenerating}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl
                hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>Create Tutorial</>
              )}
            </button>
          </div>
        </form>
        
        {/* Footer tip */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            💡 Tip: Be specific! "How backpropagation calculates gradients" works better than just "neural networks"
          </p>
        </div>
      </div>
    </div>
  )
}

const tutorials = [
  {
    id: 'ff-key-value-memories',
    title: 'Feed-Forward Layers as Key-Value Memories',
    description: 'The landmark paper revealing that MLP layers are giant lookup tables — each neuron stores a pattern (key) and a prediction (value)',
    tags: ['transformers', 'MLP', 'mechanistic interpretability', 'memory'],
    icon: '🗄️',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'word-sense-superposition',
    title: 'Word Senses in Superposition',
    description: 'How polysemous word embeddings are weighted sums of sense vectors — and how sparse coding recovers them. The intellectual ancestor of SAEs.',
    tags: ['embeddings', 'polysemy', 'sparse coding', 'superposition'],
    icon: '🔮',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'diffusion-models',
    title: 'Diffusion Models: From Images to Text to SAE',
    description: 'Understanding diffusion from first principles — how it conquers images, struggles with text, and how SAE dictionaries could unlock controllable generation',
    tags: ['diffusion', 'generative', 'SAE', 'fundamentals'],
    icon: '🎨',
    gradient: 'from-violet-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 2,
    featured: true,
  },
  {
    id: 'diffusion-sae-research',
    title: 'SAE-Guided Diffusion: Research Exploration',
    description: 'Living document tracking our investigation into combining sparse autoencoders with diffusion models for controllable text generation',
    tags: ['research', 'diffusion', 'SAE', 'generative'],
    icon: '🌊',
    gradient: 'from-sky-500 to-indigo-600',
    shadowColor: 'shadow-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    readTime: 'Ongoing',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'research-blog',
    title: 'Research Radar — Daily ArXiv Insights',
    description: 'Daily scan of cs.AI papers with connections to our Schankian operators research. Updated automatically.',
    tags: ['research', 'papers', 'daily'],
    icon: '📡',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: 'Updated daily',
    difficulty: 2,
    featured: true,
  },
  {
    id: 'research-roadmap',
    title: 'Schankian Operators — Research Roadmap',
    description: 'The 8-phase research program from discovery to deployment.',
    tags: ['research', 'roadmap'],
    icon: '🗺️',
    gradient: 'from-indigo-500 to-purple-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '10 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'group-theory-puzzles',
    title: 'Group Theory for Puzzle Solving',
    description: 'Discover how abstract symmetry helps crack puzzles — from coin flips to Rubik\'s cubes, with interactive Cayley diagrams',
    tags: ['group theory', 'puzzles', 'fundamentals'],
    icon: '🔺',
    gradient: 'from-rose-500 to-orange-500',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '12 min',
    difficulty: 1,
    featured: true,
  },
  {
    id: 'engine-demo',
    title: 'Tutorial Engine Demo',
    description: 'A self-documenting demonstration of the data-driven tutorial system with live state bindings',
    tags: ['experimental', 'meta', 'tutorial-engine'],
    icon: '🧪',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '8 min',
    difficulty: 2,
  },
  {
    id: 'lead-lag-correlation',
    title: 'Lead-Lag Correlation',
    description: 'Discover predictive relationships in time series data with cross-correlation analysis',
    tags: ['time series', 'correlation', 'quantitative finance'],
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '10 min',
    difficulty: 3,
  },
  {
    id: 'vector-projection',
    title: 'Vector Projection',
    description: 'Interactive exploration of projecting one 2D vector onto another with drag-and-drop visualization',
    tags: ['vectors', 'linear algebra', 'fundamentals'],
    icon: '↗️',
    gradient: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '8 min',
    difficulty: 1,
  },
  {
    id: 'matrix-discovery',
    title: 'Matrix Discovery',
    description: 'Interactive tool for discovering transformation matrices from input-output pairs',
    tags: ['matrices', 'linear algebra', 'clustering'],
    icon: '🔢',
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'shadow-orange-500/30',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '12 min',
    difficulty: 2,
  },
  {
    id: 'matrix-from-vectors-engine',
    title: 'Matrix from Vectors (Engine)',
    description: 'Find the transformation matrix from input-output observations — JSON-driven version',
    tags: ['linear algebra', 'matrices', 'experimental'],
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/30',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '10 min',
    difficulty: 2,
  },
  {
    id: 'matrix-from-vectors',
    title: 'Matrix from Vectors',
    description: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    tags: ['linear algebra', 'vectors', 'visualization'],
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/30',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '10 min',
    difficulty: 2,
  },
  {
    id: 'least-squares',
    title: 'Least Squares Regression',
    description: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    tags: ['regression', 'statistics', 'optimization'],
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '15 min',
    difficulty: 3,
  },
  {
    id: 'schankian-paper-draft',
    title: 'Schankian Operators Paper Draft',
    description: 'Working draft: Learning Semantic Operators from Event Data — add annotations and questions',
    tags: ['experimental', 'NLP', 'research draft'],
    icon: '📝',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '30 min',
    difficulty: 3,
  },
  {
    id: 'schankian-tree',
    title: 'Schankian Paper Tree View',
    description: 'Hierarchical summary tree of the paper draft — click nodes to expand and see details',
    tags: ['experimental', 'NLP', 'summary tree'],
    icon: '🌳',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '5 min',
    difficulty: 1,
  },
  {
    id: 'rotate-paper',
    title: 'RotatE Paper: Annotated Tutorial',
    description: 'Interactive annotated version of the foundational RotatE paper (Sun et al., ICLR 2019)',
    tags: ['experimental', 'NLP', 'knowledge graphs'],
    icon: '🔄',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '45 min',
    difficulty: 3,
  },
  {
    id: 'neural-oscillations',
    title: 'Neural Oscillations & Memory',
    description: 'How theta and gamma rhythms encode memories — and connections to semantic operators',
    tags: ['experimental', 'neuroscience', 'memory'],
    icon: '🧠',
    gradient: 'from-purple-500 to-pink-600',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '30 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-09-knn-linguistic-anchors',
    title: 'KNN with Linguistic Anchors',
    description: 'Semi-supervised operator discovery using Schank\'s primitive actions as anchor points in embedding space',
    tags: ['schankian', 'semi-supervised', 'KNN'],
    icon: '⚓',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-23-differentiable-state-machines',
    title: 'Differentiable State Machines',
    description: 'Constrained neural process networks — STRIPS-style operators made differentiable for learning valid state transitions',
    tags: ['schankian', 'architecture', 'state-machines'],
    icon: '⚙️',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-50-epistemic-operators',
    title: 'Epistemic State Operators',
    description: 'Modeling belief, doubt, and wise refusal as geometric transformations — extending operators from entity states to knowledge states',
    tags: ['schankian', 'epistemics', 'belief', 'DEL'],
    icon: '🧠',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-55-flat-arrays-to-rotations',
    title: 'From Flat Arrays to Full Rotation Matrices',
    description: 'Deriving the operator architecture from first principles — starting with the simplest graph database and building up to full rotation matrices on concatenated participants',
    tags: ['schankian', 'architecture', 'rotation', 'first-principles'],
    icon: '🔄',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '25 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-36-eigenoperators',
    title: 'Eigenoperators and Semantic Attractors',
    description: 'What eigenvectors of operator matrices reveal about dimensions of meaning — PCA on operators, fixed-point attractors, and embedding compression',
    tags: ['schankian', 'linear-algebra', 'eigenvalues', 'compression'],
    icon: '🔮',
    gradient: 'from-fuchsia-500 to-pink-600',
    shadowColor: 'shadow-fuchsia-500/30',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    readTime: '22 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-02-frame-problem-annotations',
    title: 'The Frame Problem and Implicit State Annotation',
    description: 'How making the invisible visible solves AI\'s oldest problem — the hierarchical annotation schema for Darkness Visible',
    tags: ['schankian', 'annotation', 'RAG', 'frame-problem'],
    icon: '👁️',
    gradient: 'from-slate-600 to-zinc-800',
    shadowColor: 'shadow-slate-600/30',
    glowColor: 'rgba(71, 85, 105, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-18-telicity-eigenvalues',
    title: 'Telicity from Eigenvalues',
    description: 'How Vendler\'s telic/atelic distinction emerges from operator eigenvalues — our first testable prediction connecting learned matrices to established linguistics',
    tags: ['schankian', 'linguistics', 'eigenvalues', 'prediction'],
    icon: '🎯',
    gradient: 'from-rose-500 to-red-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '22 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-06-tensor-products-fail',
    title: 'Tensor Products Fail at Compositionality',
    description: 'Why operators succeed where vector composition breaks down — bounded vs exponential dimensionality',
    tags: ['schankian', 'compositionality', 'tensors'],
    icon: '💥',
    gradient: 'from-red-500 to-rose-600',
    shadowColor: 'shadow-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-07-structure-mapping',
    title: 'Operators as Structure-Mapping Engines',
    description: 'How Schankian primitives enable analogical reasoning — from Gentner\'s theory to computational analogy',
    tags: ['schankian', 'analogy', 'cognition'],
    icon: '🔗',
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-11-talmys-force-dynamics',
    title: 'Talmy\'s Force Dynamics',
    description: 'Finer-grained causation primitives — how Agonist vs Antagonist patterns map to Schankian operators',
    tags: ['schankian', 'linguistics', 'causation'],
    icon: '💪',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-15-atomic-relations',
    title: 'ATOMIC Relations = Operator Decomposition',
    description: 'How ATOMIC\'s 9 commonsense relations decompose what Schankian operators encode — 880K training tuples as operator dimensions',
    tags: ['schankian', 'ATOMIC', 'commonsense', 'knowledge-graphs'],
    icon: '⚛️',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-16-compositional-generalization',
    title: 'Compositional Generalization — The Primitive Test',
    description: 'Can neural networks compose like humans? SCAN benchmarks, meta-learning, and Schankian operators',
    tags: ['schankian', 'compositionality', 'generalization', 'benchmarks'],
    icon: '🧩',
    gradient: 'from-violet-500 to-indigo-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-22-causal-interventions',
    title: 'Operators as Causal Interventions',
    description: 'The bridge between Schankian operators and Pearl\'s do-calculus — and how mechanistic interpretability can find operators in neural networks.',
    tags: ['causality', 'operators', 'interpretability'],
    icon: '🔬',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '18 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-54-dreamcoder-library-learning',
    title: 'DreamCoder-Style Library Learning',
    description: 'How wake-sleep loops can discover reusable semantic primitives — from program synthesis to Schankian operators',
    tags: ['schankian', 'program-synthesis', 'library-learning'],
    icon: '🌙',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'thoughtblend',
    title: 'ThoughtBlend',
    description: 'Synthesize perspectives through dialectical color mixing — add sources as color swatches and blend them into structured text or dialogue',
    tags: ['experimental', 'synthesis', 'dialectics'],
    icon: '🎨',
    gradient: 'from-teal-500 to-emerald-500',
    shadowColor: 'shadow-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    readTime: '∞',
    difficulty: 2,
    isApp: true,
  },
  {
    id: 'hungarian-basics',
    title: 'Hungarian Language Basics',
    description: 'An introduction to one of Europe\'s most unique languages — vowel harmony, agglutination, and essential phrases',
    tags: ['languages', 'Hungarian', 'linguistics'],
    icon: '🇭🇺',
    gradient: 'from-red-500 to-green-600',
    shadowColor: 'shadow-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    readTime: '12 min',
    difficulty: 1,
  },
  {
    id: 'peptides',
    title: 'Peptides: Building Blocks of Life',
    description: 'Build peptide chains by linking amino acids together — watch dehydration synthesis and learn protein structure',
    tags: ['biology', 'biochemistry', 'fundamentals'],
    icon: '🧬',
    gradient: 'from-emerald-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '10 min',
    difficulty: 1,
    isApp: true,
  },
  {
    id: 'peptides-tutorial',
    title: 'Peptides: The Molecular Alphabet',
    description: 'Comprehensive guide to amino acids, peptide bonds, and protein structure — from 20 building blocks to 100,000+ proteins',
    tags: ['biology', 'biochemistry', 'proteins'],
    icon: '🧬',
    gradient: 'from-emerald-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '15 min',
    difficulty: 2,
  },
  {
    id: 'how-peptides-can-be-used-in-a-way-that-resembles-p',
    title: 'Therapeutic Peptides: Nature\'s Precision Medicine',
    description: 'How peptides function as targeted pharmaceuticals to heal and regulate critical body processes',
    tags: ['biology', 'biochemistry', 'therapeutics'],
    icon: '💊',
    gradient: 'from-violet-500 to-fuchsia-500',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '8 min',
    difficulty: 2,
  },
  {
    id: 'category-theory',
    title: 'Category Theory',
    description: 'The mathematics of composition — from objects and morphisms to semantic operators and narrative coherence',
    tags: ['math', 'category-theory', 'schankian'],
    icon: '🔀',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '35 min',
    difficulty: 3,
  },
  {
    id: 'dict-learning-embeddings',
    title: 'Dictionary Learning for Word Embeddings',
    description: 'How sparse coding reveals the hidden structure of word vectors — from visual cortex to language, a direct ancestor of SAEs',
    tags: ['embeddings', 'dictionary learning', 'sparse coding', 'interpretability'],
    icon: '📖',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '18 min',
    difficulty: 2,
  },
  {
    id: 'transformer-dict-learning',
    title: 'Transformer Factors: The SAE Origin Story',
    description: 'Dictionary learning on transformer hidden states reveals interpretable factors — the direct intellectual ancestor of modern SAEs',
    tags: ['transformers', 'dictionary learning', 'SAE', 'interpretability', 'superposition'],
    icon: '🔬',
    gradient: 'from-rose-500 to-pink-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'word2sense',
    title: 'Word2Sense: Interpretable by Design',
    description: 'What if every dimension of a word embedding corresponded to a specific meaning? Sparse, non-negative, and readable.',
    tags: ['embeddings', 'interpretability', 'LDA', 'sparse'],
    icon: '💡',
    gradient: 'from-yellow-500 to-amber-600',
    shadowColor: 'shadow-yellow-500/30',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    readTime: '16 min',
    difficulty: 2,
  }
]

// Semantic tag color system - filled backgrounds
const tagColors = {
  // Research / Generative
  'research': 'bg-sky-100 text-sky-700 border-sky-200',
  'diffusion': 'bg-blue-100 text-blue-700 border-blue-200',
  'SAE': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'generative': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'papers': 'bg-sky-100 text-sky-700 border-sky-200',
  'daily': 'bg-teal-100 text-teal-700 border-teal-200',
  'roadmap': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  
  // Status tags - special styling
  'experimental': 'bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent',
  'meta': 'bg-violet-100 text-violet-700 border-violet-200',
  'tutorial-engine': 'bg-purple-100 text-purple-700 border-purple-200',
  
  // Difficulty
  'fundamentals': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  
  // Topics - group theory family (rose)
  'group theory': 'bg-rose-100 text-rose-700 border-rose-200',
  'puzzles': 'bg-orange-100 text-orange-700 border-orange-200',
  
  // Topics - linear algebra family (indigo/purple)
  'linear algebra': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'vectors': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'matrices': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  
  // Topics - statistics family (violet)
  'statistics': 'bg-violet-100 text-violet-700 border-violet-200',
  'regression': 'bg-violet-100 text-violet-700 border-violet-200',
  'correlation': 'bg-violet-100 text-violet-700 border-violet-200',
  
  // Topics - time series / finance (cyan)
  'time series': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'quantitative finance': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  
  // Topics - other
  'clustering': 'bg-amber-100 text-amber-700 border-amber-200',
  'visualization': 'bg-pink-100 text-pink-700 border-pink-200',
  'optimization': 'bg-green-100 text-green-700 border-green-200',
  
  // Embeddings / Interpretability
  'embeddings': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'interpretability': 'bg-amber-100 text-amber-700 border-amber-200',
  'LDA': 'bg-orange-100 text-orange-700 border-orange-200',
  'sparse': 'bg-lime-100 text-lime-700 border-lime-200',
  
  // Biology
  'biology': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'biochemistry': 'bg-teal-100 text-teal-700 border-teal-200',
  
  // Math / Category Theory
  'math': 'bg-violet-100 text-violet-700 border-violet-200',
  'category-theory': 'bg-purple-100 text-purple-700 border-purple-200',
  'schankian': 'bg-amber-100 text-amber-700 border-amber-200',
  'ATOMIC': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'commonsense': 'bg-teal-100 text-teal-700 border-teal-200',
  'knowledge-graphs': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'transformers': 'bg-blue-100 text-blue-700 border-blue-200',
  'dictionary learning': 'bg-amber-100 text-amber-700 border-amber-200',
  'interpretability': 'bg-rose-100 text-rose-700 border-rose-200',
  'superposition': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'analogy': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'cognition': 'bg-purple-100 text-purple-700 border-purple-200',
  
  // ThoughtBlend tags
  'synthesis': 'bg-teal-100 text-teal-700 border-teal-200',
  'dialectics': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  
  // Embeddings / Sparse Coding
  'sparse coding': 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

// Difficulty display
const difficultyLabels = ['Beginner', 'Intermediate', 'Advanced']
const difficultyStars = (level) => '★'.repeat(level) + '☆'.repeat(3 - level)

function TutorialCard({ tutorial, featured = false }) {
  // Apps have their own routes, tutorials use /tutorial/:id
  const linkPath = tutorial.isApp ? `/${tutorial.id}` : `/tutorial/${tutorial.id}`
  
  return (
    <Link 
      to={linkPath}
      className={`group block no-underline ${featured ? 'md:col-span-2' : ''}`}
    >
      <div className={`
        relative h-full rounded-2xl p-8
        bg-white/90 backdrop-blur-sm
        border border-gray-100
        shadow-[0_1px_3px_rgba(0,0,0,0.05)]
        hover:shadow-[0_25px_50px_rgba(99,102,241,0.15)]
        hover:border-indigo-300
        hover:scale-[1.02]
        transition-all duration-300 ease-out
        cursor-pointer
        overflow-hidden
      `}>
        {/* Gradient reveal on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-purple-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Glowing border on hover */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 0 1px ${tutorial.glowColor?.replace('0.4', '0.3') || 'rgba(99, 102, 241, 0.3)'}`
          }}
        />
        
        {/* Content */}
        <div className="relative">
          {/* Icon with animated glow */}
          <div 
            className={`
              w-12 h-12 rounded-xl bg-gradient-to-br ${tutorial.gradient}
              flex items-center justify-center mb-6
              transition-all duration-300
              group-hover:-translate-y-1 group-hover:scale-110
              shadow-lg
            `}
            style={{
              boxShadow: `0 4px 14px ${tutorial.glowColor || 'rgba(99, 102, 241, 0.3)'}`,
            }}
          >
            <span className="text-2xl group-hover:animate-bounce">{tutorial.icon}</span>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 
            group-hover:text-indigo-600 transition-colors duration-200
            tracking-tight"
          >
            {tutorial.title}
          </h2>
          
          {/* Meta row: time + difficulty */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tutorial.readTime}
            </span>
            <span className="text-amber-500">{difficultyStars(tutorial.difficulty)}</span>
          </div>
          
          {/* Description */}
          <p className="text-gray-600 mt-3 leading-7 text-[15px]">
            {tutorial.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
            {tutorial.tags.map(tag => (
              <span 
                key={tag}
                className={`inline-flex items-center px-2.5 py-1 
                  rounded-full text-[11px] font-semibold
                  border cursor-pointer
                  transition-all duration-200
                  hover:scale-105 hover:shadow-sm
                  ${tagColors[tag] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Animated gradient background styles
const heroStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-gradient {
    animation: gradient-shift 15s ease infinite;
    background-size: 200% 200%;
  }
  @keyframes subtle-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .group:hover .group-hover\\:animate-bounce {
    animation: subtle-bounce 0.5s ease-in-out;
  }
`

// Compact list item for list view
function TutorialListItem({ tutorial }) {
  const linkPath = tutorial.isApp ? `/${tutorial.id}` : `/tutorial/${tutorial.id}`
  
  return (
    <Link to={linkPath} className="group block no-underline">
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl
        bg-white/90 border border-gray-100
        hover:bg-indigo-50/50 hover:border-indigo-200
        hover:shadow-md
        transition-all duration-200">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tutorial.gradient}
            flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <span className="text-lg">{tutorial.icon}</span>
        </div>
        
        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {tutorial.title}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0">{tutorial.readTime}</span>
            <span className="text-xs text-amber-400 flex-shrink-0">{difficultyStars(tutorial.difficulty)}</span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{tutorial.description}</p>
        </div>
        
        {/* Tags (only first 2) */}
        <div className="hidden md:flex gap-1.5 flex-shrink-0">
          {tutorial.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border
                ${tagColors[tag] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Arrow */}
        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

// View toggle button
function ViewToggle({ mode, onChange }) {
  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
      <button
        onClick={() => onChange('grid')}
        className={`p-2 rounded-md transition-all ${
          mode === 'grid'
            ? 'bg-indigo-100 text-indigo-600 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        title="Grid view"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-md transition-all ${
          mode === 'list'
            ? 'bg-indigo-100 text-indigo-600 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        title="List view"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <rect x="1" y="1" width="14" height="3" rx="1" />
          <rect x="1" y="6.5" width="14" height="3" rx="1" />
          <rect x="1" y="12" width="14" height="3" rx="1" />
        </svg>
      </button>
    </div>
  )
}

export default function Listing() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [allTutorials, setAllTutorials] = useState(tutorials)
  
  // Auto-discover JSON tutorials not in the curated list
  useEffect(() => {
    const discoverTutorials = async () => {
      try {
        // Use Vite's glob import to find all content JSON files
        const contentModules = import.meta.glob('../content/*.json')
        const knownIds = new Set(tutorials.map(t => t.id))
        const discovered = []
        
        for (const [path, loader] of Object.entries(contentModules)) {
          const filename = path.split('/').pop().replace('.json', '')
          
          // Skip non-tutorial files
          if (filename.includes('semantic-tree') || filename.includes('-quiz')) continue
          
          // Skip already listed
          if (knownIds.has(filename)) continue
          
          try {
            const module = await loader()
            const data = module.default || module
            
            // Only include files that look like tutorials (have title + content)
            if (data.title && data.content) {
              discovered.push({
                id: filename,
                title: data.title,
                description: data.subtitle || data.description || 'Auto-discovered tutorial',
                tags: data.tags || ['uncategorized'],
                icon: '📄',
                gradient: 'from-gray-500 to-slate-600',
                shadowColor: 'shadow-gray-500/30',
                glowColor: 'rgba(107, 114, 128, 0.4)',
                readTime: data.readTime || '? min',
                difficulty: data.difficulty || 1,
                autoDiscovered: true,
              })
            }
          } catch (e) {
            // Skip files that can't be parsed
          }
        }
        
        if (discovered.length > 0) {
          console.log(`Auto-discovered ${discovered.length} unlisted tutorials:`, discovered.map(d => d.id))
          setAllTutorials([...tutorials, ...discovered])
        }
      } catch (e) {
        console.error('Tutorial discovery failed:', e)
      }
    }
    
    discoverTutorials()
  }, [])
  
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <style>{heroStyles}</style>
      <CreateTutorialModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      {/* Hero Section with Atmospheric Depth */}
      <header className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div 
          className="absolute inset-0 animate-gradient"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
              radial-gradient(ellipse 60% 40% at 80% 50%, rgba(79, 70, 229, 0.15), transparent),
              radial-gradient(ellipse 50% 50% at 20% 80%, rgba(147, 51, 234, 0.1), transparent),
              linear-gradient(to bottom, #0f0e17, #1a1825)
            `
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Floating glow orbs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32 text-center">
          {/* Headline with gradient text */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 80px rgba(99, 102, 241, 0.5)' }}>
              Tutorials
            </span>
          </h1>
          
          {/* Tagline with personality */}
          <p className="text-lg sm:text-xl text-indigo-200/80 mt-6 max-w-2xl mx-auto font-light leading-relaxed">
            Master the math behind the magic
          </p>
          
          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-indigo-300/60">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✦</span>
              <span>{allTutorials.length} tutorials</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✦</span>
              <span>Interactive exercises</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">✦</span>
              <span>AI-powered explanations</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl
                hover:from-indigo-600 hover:to-purple-700 hover:scale-105
                transition-all duration-200 shadow-lg shadow-indigo-500/30
                flex items-center gap-2"
            >
              <span>✨</span>
              Create tutorial about...
            </button>
            <Link
              to="/implications"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 font-medium rounded-xl
                border border-emerald-500/30 hover:border-emerald-400/50 hover:scale-105
                transition-all duration-200
                flex items-center gap-2"
            >
              <span>🌐</span>
              Implications Cloud
            </Link>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafafa] to-transparent" />
      </header>
      
      {/* Tutorial Grid */}
      <Container size="wide" className="py-12 -mt-12">
        {/* View toggle */}
        <div className="flex justify-end mb-4">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allTutorials.map((tutorial, i) => (
              <TutorialCard 
                key={tutorial.id} 
                tutorial={tutorial}
                featured={i === 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allTutorials.map((tutorial) => (
              <TutorialListItem key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        )}
        
        {/* "Continue your journey" section - delighter */}
        <div className="mt-12 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-8 border border-violet-100/50 
          hover:shadow-lg hover:shadow-violet-500/10 transition-shadow duration-300">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <p className="text-sm font-medium text-violet-600 mb-2 flex items-center gap-2">
                <span>✨</span> Recommended path
              </p>
              <h3 className="text-xl font-bold text-gray-900">Start with Vector Projection</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-xl">
                Build intuition for linear algebra concepts with drag-and-drop visualization, 
                then progress through matrix transformations.
              </p>
            </div>
            <Link 
              to="/tutorial/vector-projection"
              className="flex-shrink-0 px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl
                hover:bg-indigo-700 hover:scale-105 transition-all duration-200 
                shadow-lg shadow-indigo-500/25"
            >
              Get started →
            </Link>
          </div>
        </div>
        
        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-400">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 ring-2 ring-white" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 ring-2 ring-white" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white" />
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 ring-2 ring-white text-[10px] font-medium text-gray-500">+12</div>
          </div>
          <span>15 others learning right now</span>
        </div>
      </Container>
    </div>
  )
}
