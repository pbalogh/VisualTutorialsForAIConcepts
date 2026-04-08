import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../components/SharedUI.jsx'
import { API_BASE } from '../config.js'
import { useSearchIndex } from '../hooks/useSearchIndex.js'
import tutorialTimestamps from 'virtual:tutorial-timestamps'

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
      const response = await fetch(`${API_BASE}/generate`, {
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
    id: 'dragon-hatchling-bdh',
    title: 'Dragon Hatchling (BDH)',
    description: 'A biologically-inspired LLM architecture combining scale-free networks, Hebbian learning, and inherent interpretability',
    tags: ['architecture', 'biological', 'SSM', 'interpretability', 'spiking neurons'],
    icon: '🐉',
    gradient: 'from-orange-500 to-red-500',
    shadowColor: 'shadow-orange-500/25',
    glowColor: 'orange',
    readTime: '18 min',
    difficulty: 'Advanced',
  },
  {
    id: 'symmetry-representations',
    title: 'Symmetry in Language Statistics → Geometry of Representations',
    description: 'Why months form circles, years form manifolds, and cities encode lat/long — how translation symmetry in co-occurrence statistics analytically determines representational geometry. Based on Karkada et al. (arXiv:2602.15029).',
    tags: ['symmetry', 'co-occurrence', 'manifolds', 'Fourier', 'word embeddings', 'LLM representations', 'geometry'],
    icon: '🔄',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'rgba(6, 182, 212, 0.3)',
    glowColor: 'rgba(6, 182, 212, 0.15)',
    readTime: '35 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'fine-tuning-mechanics',
    title: 'Fine-Tuning LLMs: Mechanics, Myths, and the Knowledgebase Dream',
    description: 'What actually happens to weights during fine-tuning, why LoRA works, what you can and can\'t achieve, and the realistic path to turning a small LLM into a domain expert.',
    tags: ['fine-tuning', 'LoRA', 'LLM', 'deep learning', 'fundamentals'],
    icon: '🔧',
    gradient: 'from-orange-500 to-red-600',
    shadowColor: 'rgba(249, 115, 22, 0.3)',
    glowColor: 'rgba(249, 115, 22, 0.15)',
    readTime: '25 min',
    difficulty: 2,
    featured: true,
  },
  {
    id: 'geometric-deep-learning',
    title: 'Geometric Deep Learning: From Symmetry to Neural Networks',
    description: 'How symmetry principles unify CNNs, GNNs, Transformers, and beyond — the Bronstein et al. blueprint, representation theory, gauge equivariance, and connections to polysemy.',
    tags: ['geometric deep learning', 'group theory', 'equivariance', 'GNN', 'transformers', 'manifolds'],
    icon: '💎',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'rgba(99, 102, 241, 0.3)',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    readTime: '60 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'brainstorm-10-hierarchical-operator-trees',
    title: 'Hierarchical Operator Trees',
    description: 'Symbolic + Geometric: organizing Schankian operators into trees where each node is BOTH a label AND an embedding region. Handles polysemy, composition, and metaphor.',
    tags: ['Schankian', 'operators', 'hierarchy', 'hyperbolic', 'polysemy', 'brainstorm'],
    icon: '🌲',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'rgba(245, 158, 11, 0.3)',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    readTime: '25 min',
    difficulty: 'intermediate',
  },
  {
    id: 'brainstorm-79-type-constructors',
    title: 'Schankian Primitives as Type Constructors',
    description: 'How Schank\'s semantic primitives map to type theory — operators generate event structure spaces, parse shapes are types, words are values. With testable predictions for shape embedding clustering.',
    tags: ['Schankian', 'type theory', 'parse shapes', 'syntax-semantics', 'brainstorm'],
    icon: '🏗️',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'rgba(99, 102, 241, 0.3)',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    readTime: '18 min',
    difficulty: 'advanced',
  },
  {
    id: 'brainstorm-78-operator-decomposition-trees',
    title: 'Operator Decomposition Trees',
    description: 'How Schankian operators form recursive decomposition trees — simultaneously story plan, interpretable trace, and editable outline',
    tags: ['Schankian', 'operators', 'trees', 'generation', 'brainstorm'],
    icon: '🌳',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    readTime: '20 min',
    difficulty: 'intermediate',
  },
  {
    id: 'brainstorm-77-recursive-midpoint',
    title: 'Recursive Midpoint Diffusion',
    description: 'Brownian lightning for text generation — endpoints first, details last. A radical architecture that generates text from the outside in with O(log n) depth, embarrassing parallelism, and natural global coherence.',
    tags: ['diffusion', 'text generation', 'architecture', 'parallelism', 'SAE', 'hierarchical planning', 'Schankian operators'],
    icon: '⚡',
    gradient: 'from-purple-500 to-fuchsia-600',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-74-attention-heads-modal-operators',
    title: 'Attention Heads as Modal Operators',
    description: 'How transformer attention implements Kripke accessibility relations — unifying epistemic reasoning, Bloom filter heads, and Schankian mental primitives under modal logic.',
    tags: ['modal logic', 'attention', 'Kripke', 'mechanistic interpretability', 'epistemic', 'Schankian operators'],
    icon: '🔮',
    gradient: 'from-violet-500 to-indigo-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 4,
  },
  {
    id: 'where-grammar-lives',
    title: 'Where Grammar Lives: Syntactic Transition Priors in MLP Vectors',
    description: 'We matched MLP input/output vectors across tokens in GPT-2 and found something unexpected: displacement vectors encode syntactic transition probabilities — not semantic content, but grammar itself.',
    tags: ['GPT-2', 'MLP', 'mechanistic interpretability', 'POS', 'syntax', 'displacement vectors'],
    icon: '🗺️',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'first-three-minutes-of-a-transformer',
    title: 'The First Three Minutes of a Transformer',
    description: 'Everything that happens to raw text before Layer 1 — BPE tokenization, the embedding matrix, positional encoding, and the vector that enters GPT-2.',
    tags: ['transformers', 'GPT-2', 'tokenization', 'BPE', 'embeddings', 'positional encoding', 'BERT'],
    icon: '⏱️',
    gradient: 'from-sky-500 to-blue-600',
    shadowColor: 'shadow-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    readTime: '20 min',
    difficulty: 1,
  },
  {
    id: 'second-three-minutes-of-a-transformer',
    title: 'The Second Three Minutes of a Transformer',
    description: 'From Layer 1 to the next token — attention, the residual stream, MLPs, and how GPT-2 turns vectors into language. Sequel to The First Three Minutes.',
    tags: ['transformers', 'GPT-2', 'attention', 'residual stream', 'MLP', 'BERT', 'softmax', 'unembedding'],
    icon: '⏱️',
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '25 min',
    difficulty: 2,
  },
  {
    id: 'neural-turing-machines-dnc',
    title: 'Neural Turing Machines & DNCs',
    description: 'When neural networks got their own RAM — differentiable memory, learned algorithms, and why these ideas are due for a comeback.',
    tags: ['architecture', 'memory', 'NTM', 'DNC', 'attention', 'differentiable computing'],
    icon: '🖥️',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '30 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-25-mining-sae-dictionaries',
    title: 'Mining SAE Dictionaries for Schankian Operators',
    description: 'What if Anthropic\'s 34M monosemantic features already contain Schankian primitives? Search instead of train — a potential shortcut that validates the hypothesis AND gets operators for free.',
    tags: ['SAE', 'operators', 'Schank', 'mechanistic interpretability', 'features', 'sparse autoencoders'],
    icon: '⛏️',
    gradient: 'from-amber-500 to-yellow-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-66-thought-gestalts',
    title: 'Thought Gestalts — Sentence-Level Operators',
    description: 'How two-level transformers with thought states provide the perfect architecture for Schankian operators — plus the fractal three-level operator hierarchy.',
    tags: ['thought gestalts', 'operators', 'Schank', 'architecture', 'working memory'],
    icon: '🧠',
    gradient: 'from-violet-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-39-information-bottleneck',
    title: 'Information Bottleneck as Operator Discovery',
    description: 'How compression reveals semantic primitives — squeeze event descriptions through a bottleneck and what survives IS the Schankian operator. No labels needed.',
    tags: ['information theory', 'compression', 'operators', 'Schank', 'IB', 'unsupervised'],
    icon: '🔬',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-45-mdl-operator-discovery',
    title: 'MDL Operator Discovery — Compression as Primitivity Test',
    description: 'How Minimum Description Length finds the right number of Schankian operators — not too few, not too many. The compression sweet spot reveals true primitives.',
    tags: ['MDL', 'compression', 'operators', 'Schank', 'Kolmogorov', 'information theory'],
    icon: '🗜️',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-75-kan-operators',
    title: 'KAN Edge Functions as Interpretable Operators',
    description: 'How Kolmogorov-Arnold Networks learn per-dimension spline functions that are structurally identical to Schankian operators, with automatic symbolic extraction yielding human-readable equations.',
    tags: ['KAN', 'Kolmogorov-Arnold', 'operators', 'interpretability', 'splines'],
    icon: '📐',
    gradient: 'from-violet-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-82-vla-mech-interp',
    title: 'VLA Mech Interp — Action Primitives as Thin Semantic Layer',
    description: 'How Vision-Language-Action models reveal action primitives are a thin layer atop semantic representations — direct evidence for the operator-as-interface thesis.',
    tags: ['VLA', 'mech interp', 'operators', 'embodied AI', 'SAE'],
    icon: '🤖',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-84-manifold-local-operators',
    title: 'Schankian Primitives as Manifold-Local Operators',
    description: 'What if ATRANS means something different in every register? Exploring Schankian primitives as sections of a fiber bundle over the speech manifold — varying across registers, sociolects, and modalities.',
    tags: ['operators', 'manifold', 'fiber bundle', 'register', 'geometry'],
    icon: '🌍',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-85-operator-discovery-denoising',
    title: 'Operator Discovery as Denoising',
    description: 'Wake-sleep operator discovery is structurally isomorphic to diffusion-based denoising. Generic events are noise, the LLM adapter is a denoising step, and the MDL objective is a noise schedule.',
    tags: ['diffusion', 'denoising', 'wake-sleep', 'MDL', 'compression', 'operators'],
    icon: '🌫️',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-88-boolean-circuit-extraction',
    title: 'Boolean Circuit Extraction as Primitive Discovery',
    description: 'How MLP neurons compose into Boolean lookup tables, and how recurring circuit motifs reveal learned Schankian primitives with inspectable truth tables.',
    tags: ['mechanistic interpretability', 'Boolean circuits', 'MLPs', 'Schank', 'primitives'],
    icon: '🔌',
    gradient: 'from-emerald-500 to-cyan-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-62-moe-routing-operators',
    title: 'Operators as Semantic Expert Modules',
    description: 'How Mixture-of-Experts routing is structurally identical to Schankian primitive selection — constrain experts to ~14 and rediscover semantic primitives.',
    tags: ['MoE', 'operators', 'Schank', 'routing', 'architecture'],
    icon: '🎯',
    gradient: 'from-rose-500 to-orange-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'functional-information',
    title: 'Functional Information: Measuring Complexity That Matters',
    description: 'From combination locks to neural networks — why the universe keeps getting more interesting. Ladders from ELI5 to graduate-level FI theory.',
    tags: ['information theory', 'functional information', 'complexity', 'evolution'],
    icon: '🧬',
    gradient: 'from-emerald-500 to-cyan-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'interp-crash-course',
    title: 'Interpretability Crash Course: Hands-On with TransformerLens, SAEs & Circuits',
    description: 'Six-module interactive companion — from loading models to replicating the Bloom filter heads paper. Covers TransformerLens, ablation, SAELens, probing, steering, circuit analysis, and full paper replication.',
    tags: ['mechanistic interpretability', 'TransformerLens', 'SAEs', 'hands-on'],
    icon: '🧪',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '30 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-28-differentiable-strips',
    title: 'Operators as Differentiable STRIPS',
    description: 'The neuro-symbolic bridge — how classical AI planning actions (preconditions + effects) become learned geometric transformations. Solves the frame problem for free.',
    tags: ['Schankian', 'operators', 'STRIPS', 'planning', 'neuro-symbolic', 'brainstorm'],
    icon: '🗺️',
    gradient: 'from-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
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
    id: 'brainstorm-34-semantic-intervals',
    title: 'Operators as Semantic Intervals — The Music Theory of Meaning',
    description: 'How transposition-invariant transformations connect word2vec analogies, Schankian operators, and musical harmony. Melodies are interval sequences; narratives are operator sequences.',
    tags: ['Schankian', 'operators', 'music theory', 'analogy', 'word2vec', 'intervals', 'brainstorm'],
    icon: '🎵',
    gradient: 'from-pink-500 to-rose-600',
    shadowColor: 'shadow-pink-500/30',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '25 min',
    difficulty: 2,
  },
  {
    id: 'geometry-of-polysemy',
    title: 'The Geometry of Polysemy',
    description: 'How raw cosine similarity achieves 99.8%+ accuracy for word sense disambiguation in GPT-2 — no classifier needed. The sense inventory was the bottleneck, not the classifier.',
    tags: ['embeddings', 'polysemy', 'GPT-2', 'cosine similarity'],
    icon: '📐',
    gradient: 'from-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    readTime: '25 min',
    difficulty: 2,
    featured: true,
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
    id: 'pure-sense-sufficiency-test',
    title: 'The Sufficiency Test: Did You Cut in the Right Place?',
    description: 'How to verify that your pure sense embedding actually contains the sense — and only the sense — using surgical ablation with linear probes.',
    tags: ['embeddings', 'polysemy', 'probing', 'decomposition', 'verification'],
    icon: '🔬',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '18 min',
    difficulty: 3,
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
    id: 'transformerlens',
    title: 'TransformerLens: X-Ray Vision for Language Models',
    description: 'Inspect, hook, and manipulate transformer internals using Neel Nanda\'s mechanistic interpretability library.',
    tags: ['mechanistic interpretability', 'TransformerLens', 'tools'],
    icon: '🔬',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '15 min',
    difficulty: 2,
  },
  {
    id: 'anxiety-of-influence-bloom-filter-heads',
    title: 'The Anxiety of Influence: Bloom Filters in Attention Heads',
    description: 'Interactive companion to the paper — discover how transformer attention heads implement membership testing like classical Bloom filters.',
    tags: ['mechanistic interpretability', 'attention heads', 'transformers'],
    icon: '🔍',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '20 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'dendritic-diffusion',
    title: 'Dendritic Diffusion: Growing Sentences Like Crystals',
    description: 'How we turned a masked diffusion language model into a depth-first crystal grower — and why text generation should work more like dendrites than assembly lines.',
    tags: ['diffusion models', 'language generation', 'dendritic diffusion', 'emergent structure'],
    icon: '🔮',
    gradient: 'from-violet-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '18 min',
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
    id: 'brainstorm-44-periodic-table-of-operators',
    title: 'The Periodic Table of Operators',
    description: 'Organizing semantic primitives by domain × transformation type — and predicting undiscovered operators from gaps, validated by cross-linguistic universals',
    tags: ['schankian', 'taxonomy', 'cross-linguistic', 'NSM', 'operator discovery'],
    icon: '🧪',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
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
    id: 'brainstorm-05-prototypes-good-enough-centers',
    title: 'Prototypes vs. Definitions — Good Enough Centers',
    description: 'Why Schankian primitives work like Rosch\'s prototypes — fuzzy, gradient, and "good enough" rather than rigidly defined',
    tags: ['schankian', 'prototypes', 'categorization', 'embeddings'],
    icon: '🎯',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '18 min',
    difficulty: 1,
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
    id: 'brainstorm-58-delta-guided-attention',
    title: 'Delta-Guided Attention',
    description: 'SAE features as attractor targets for contextual disambiguation — making attention explicitly goal-directed',
    tags: ['schankian', 'SAE', 'attention', 'interpretability'],
    icon: '🎯',
    gradient: 'from-cyan-500 to-teal-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-61-successor-representation',
    title: 'Operators Generate the Successor Representation',
    description: 'Scripts as factored predictive maps — how Schankian operators are literally the transition matrix that generates the brain\'s GPS for events',
    tags: ['schankian', 'neuroscience', 'successor-representation', 'scripts'],
    icon: '🗺️',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '22 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-51-adversarial-perturbation',
    title: 'Adversarial Pressure as Operator Perturbation',
    description: 'Sycophancy through a geometric lens — how social pressure acts as a Lie algebra perturbation rotating model outputs away from truth',
    tags: ['schankian', 'sycophancy', 'lie-groups', 'adversarial', 'geometric', 'alignment'],
    icon: '🧲',
    gradient: 'from-red-500 to-rose-600',
    shadowColor: 'shadow-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-37-lie-algebra',
    title: 'Lie Algebra Structure — Commutators Capture Order Effects',
    description: 'Why "harm then heal" ≠ "heal then harm" — how Lie algebras formalize non-commutativity of Schankian operators, with commutators as emergent semantic primitives.',
    tags: ['Lie algebra', 'operators', 'Schank', 'commutator', 'non-commutativity', 'rotation matrices'],
    icon: '🔄',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-63-operators-as-options',
    title: 'Operators as Options',
    description: 'Temporal abstraction as event semantics — how Schankian operators ARE Sutton\'s options, with initiation sets, policies, and termination conditions',
    tags: ['schankian', 'reinforcement-learning', 'options', 'temporal-abstraction', 'event-segmentation'],
    icon: '⏱️',
    gradient: 'from-orange-500 to-amber-600',
    shadowColor: 'shadow-orange-500/30',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-57-reward-machine-transitions',
    title: 'Operators as Reward Machine Transitions',
    description: 'How Schankian operators become the transition language for agentic planning — bridging narrative understanding and reinforcement learning',
    tags: ['schankian', 'reinforcement-learning', 'reward-machines', 'planning', 'symbol-grounding'],
    icon: '🎰',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-52-pearls-ladder',
    title: "Pearl's Ladder as an Operator Hierarchy",
    description: "Why confusing correlation with causation is literally a type error — three classes of operators formalize the Causal Hierarchy Theorem",
    tags: ['schankian', 'causality', 'pearl', 'type-theory', 'category-theory'],
    icon: '🪜',
    gradient: 'from-amber-500 to-red-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-59-modal-operators-tom',
    title: 'Differentiable Modal Operators & Theory of Mind',
    description: 'How Schank\'s mental primitives (MBUILD, MTRANS) are modal operators in disguise — Kripke semantics, BDI architecture, and learnable belief tracking',
    tags: ['schankian', 'modal-logic', 'theory-of-mind', 'mental-primitives'],
    icon: '🧠',
    gradient: 'from-purple-500 to-pink-600',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '25 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-24-operators-as-interface-layer',
    title: 'Operators as Interface Layer for LLM World Models',
    description: 'LLMs have implicit world models — Schankian operators extract and organize that hidden knowledge into explicit, composable event semantics',
    tags: ['schankian', 'world-models', 'LLM', 'interface-layer', 'extraction'],
    icon: '🔌',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-56-rate-distortion-bounds',
    title: 'Rate-Distortion Bounds on Operator Compression',
    description: 'When do embeddings provably fail? Shannon\'s theory reveals the minimum dimensions each Schankian operator needs',
    tags: ['schankian', 'information-theory', 'rate-distortion', 'embeddings'],
    icon: '📉',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '20 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-89-wake-sleep-library-learning',
    title: 'Wake-Sleep Library Learning for Operator Discovery',
    description: 'Let compression find the primitives — DreamCoder/Lilo-style wake-sleep cycles discover Schankian operators from data, deriving their number and nature via MDL pressure rather than hand-crafting them.',
    tags: ['Schankian', 'DreamCoder', 'Lilo', 'MDL', 'compression', 'library-learning', 'wake-sleep'],
    icon: '🌗',
    gradient: 'from-violet-500 to-amber-500',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '24 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-91-causal-abstraction',
    title: 'Causal Abstraction as Operator Verification',
    description: 'Interchange interventions for Schankian primitives — proving operators are causally computed inside transformers, not just decodable. Compare Schank-11 vs Dowty-4 vs data-driven primitives.',
    tags: ['Schankian', 'causal-abstraction', 'interchange-interventions', 'DII', 'mech-interp', 'falsifiable'],
    icon: '🔬',
    gradient: 'from-emerald-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '20 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-41-attention-motifs',
    title: 'Operators as Attention Motifs',
    description: 'Schankian primitives may already exist inside transformers as characteristic multi-head attention patterns. Cluster attention motifs on event sentences to discover operators — connected to the N2123 vote counter finding.',
    tags: ['Schankian', 'attention', 'mech-interp', 'operators', 'motifs', 'circuits'],
    icon: '🎯',
    gradient: 'from-rose-500 to-red-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-42b-negative-knowledge-binding-energy',
    title: 'Negative Knowledge as Binding Energy',
    description: 'What you don\'t know has a shape. Schankian primitives with unfilled slots ARE lambda terms with free variables. Binding energy = number of free slots = minimum questions to ask. Connects Schank\'s 1977 gap-filling to lambda calculus and information theory.',
    tags: ['Schankian', 'lambda-calculus', 'knowledge-representation', 'information-theory', 'negative-knowledge'],
    icon: '∅',
    gradient: 'from-amber-500 to-orange-700',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-42-lambda-calculus-bridge',
    title: 'Lambda Calculus as the Bridge Between Operator Discovery and SAE Features',
    description: 'GPT-2 implements a lambda calculus over entity-state transformations. Operators are tensors in orthogonal SAE subspaces (14.4× separation). Partial application produces rank decrease (12/12). Future arguments = zero change. Mentalese has its own grammar with canonical argument order and case features.',
    tags: ['Schankian', 'lambda-calculus', 'SAE', 'mech-interp', 'operators', 'partial-application', 'case-system'],
    icon: 'λ',
    gradient: 'from-violet-500 to-purple-700',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '30 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-92-routing-signatures',
    title: 'Operator Discovery via Routing Signatures',
    description: 'Knowledge neurons are routing neurons — the same 27 neurons appear for every fact (36.5× enrichment). Schankian operators should be discoverable as distinct routing configurations in the 7D consensus space.',
    tags: ['Schankian', 'routing', 'knowledge-neurons', 'mech-interp', 'consensus', 'experimental'],
    icon: '🛤️',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-96-inference-time-orchestration',
    title: 'Operators as Inference-Time Orchestration Programs',
    description: 'What if Schankian operators aren\'t inside the model? Inspired by dendritic diffusion\'s model-agnostic orchestration layer, this tutorial reframes operators as inference-time steering protocols — external programs that configure model behavior via activation steering, not internal representations to be discovered.',
    tags: ['Schankian', 'dendritic-diffusion', 'inference-time', 'steering', 'activation-engineering'],
    icon: '🎛️',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '18 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-83-active-inference',
    title: 'Active Inference Meets Schankian Operators',
    description: 'Friston\'s Free Energy Principle maps directly onto Schankian operators: operators ARE event-level generative models, event boundaries ARE prediction error spikes, scripts ARE hierarchical predictions, and cross-entropy training IS free energy minimization.',
    tags: ['Schankian', 'free-energy', 'active-inference', 'predictive-coding', 'Friston', 'theoretical'],
    icon: '🧠',
    gradient: 'from-violet-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '24 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-85-deeponet-operators',
    title: 'DeepONet: Operators as Learned Functional Mappings',
    description: 'Physics-informed neural operator architectures map perfectly onto Schankian semantic primitives. Branch=operator encoder, Trunk=entity encoder, dot product=application. Universal Approximation Theorem guarantees expressivity.',
    tags: ['Schankian', 'deeponet', 'neural-operators', 'architecture', 'operator-learning'],
    icon: '🔬',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '18 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-94-concept-decoupling-cats-net',
    title: 'Concept Decoupling as Operator Formation — The CATS Net Bridge',
    description: 'How CATS Net\'s dual-module architecture maps to Schankian operator formation and application, bridging neuroscience and symbolic AI',
    tags: ['CATS Net', 'concept formation', 'operators', 'Gärdenfors', 'architecture'],
    icon: '🧩',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '18 min',
    difficulty: 'intermediate',
  },
  {
    id: 'brainstorm-47-semantic-renormalization',
    title: 'Semantic Renormalization Group',
    description: 'Schankian operators as RG fixed points — why different verbs across all languages converge to the same primitives under coarse-graining, just like physical universality classes.',
    tags: ['Schankian', 'renormalization', 'physics', 'universality', 'coarse-graining'],
    icon: '🔄',
    gradient: 'from-rose-500 to-purple-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '25 min',
    difficulty: 4,
  },
  {
    id: 'brainstorm-72-resonator-networks',
    title: 'Resonator Networks — VSA Operator Factorization',
    description: 'How Vector Symbolic Architectures decompose event vectors into operator × agent × patient — codebook convergence IS Schankian primitive discovery.',
    tags: ['Schankian', 'VSA', 'resonator', 'factorization', 'binding'],
    icon: '📡',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '30 min',
    difficulty: 4,
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
    id: 'why-networks-dont-collapse',
    title: "Why Neural Networks Don't Collapse Into a Single Matrix",
    description: "The geometry of nonlinearity — how activation functions fold space, break linearity, and make depth meaningful. From the collapse theorem to origami to transformers.",
    tags: ['neural networks', 'linear algebra', 'activation functions', 'ReLU', 'deep learning', 'fundamentals'],
    icon: '🫧',
    gradient: 'from-rose-500 to-violet-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '25 min',
    difficulty: 1,
    featured: true,
  },
  {
    id: 'reverse-engineering-a-prediction',
    title: 'Reverse-Engineering a GPT-2 Prediction',
    description: 'A forensic investigation tracing how GPT-2 predicts the next token after "The cat sat on the mat" — with real numbers from every layer, attention head, and MLP.',
    tags: ['GPT-2', 'mechanistic interpretability', 'TransformerLens', 'transformers'],
    icon: '🔍',
    gradient: 'from-red-500 to-orange-600',
    shadowColor: 'shadow-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    readTime: '25 min',
    difficulty: 2,
    featured: true,
  },
  {
    id: 'from-matrices-to-functions',
    title: 'From Matrices to Functions: What If Neural Networks Used Richer Math?',
    description: 'Why matrices can\'t capture nonlinear maps, functions as ultimate compression, weights as parameters not data, KANs, structured matrices, and the frontier of richer mathematical primitives.',
    tags: ['neural networks', 'linear algebra', 'kernel methods', 'KAN', 'Fourier', 'compression', 'deep learning'],
    icon: '🔬',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '30 min',
    difficulty: 2,
    featured: true,
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
  },
  {
    id: 'brainstorm-98-grammar-protocol-layers',
    title: 'Grammar Tags as Protocol Layers',
    description: 'How symbolic grammar tags create inspectable interfaces between neural modules — from Stack-SSM to Grammar-Mamba',
    tags: ['grammar', 'protocol', 'modularity', 'mamba', 'syntax'],
    icon: '🔌',
    gradient: 'from-teal-500 to-cyan-500',
    shadowColor: 'shadow-teal-500/25',
    glowColor: 'teal',
    readTime: '15 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-99-kolmogorov-event-cognition',
    title: 'The Kolmogorov Complexity of Event Cognition',
    description: 'Why compression rediscovers Schank\'s primitives — MDL, wake-sleep discovery, and what data-driven operators reveal that hand-crafted ones missed',
    tags: ['kolmogorov-complexity', 'MDL', 'compression', 'operators', 'wake-sleep', 'event-cognition'],
    icon: '📦',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/25',
    glowColor: 'amber',
    readTime: '18 min',
    difficulty: 2,
  },
  {
    id: 'brainstorm-100-operator-params-distributions',
    title: 'Operator Parameters as Evolved Distributions',
    description: 'Unifying symbolic regression, probabilistic programming, and evolutionary algorithms — the three-layer language of thought',
    tags: ['operators', 'probabilistic-programming', 'evolutionary-algorithms', 'symbolic-regression', 'webppl'],
    icon: '🧬',
    gradient: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-500/25',
    glowColor: 'purple',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-82-compression-codebook-consolidation',
    title: 'Operators as the Compression Codebook for Memory Consolidation',
    description: 'Why Schankian primitives are the schemas that make sleep learning possible — connecting operator libraries to neuroscience of memory consolidation.',
    tags: ['Schankian', 'memory consolidation', 'compression', 'sleep', 'neuroscience'],
    icon: '🌙',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'modal-lambda-knowledge-store',
    title: 'Lambda Calculus as a Knowledge Store: Possible Worlds for AI Memory',
    description: 'What if AI could tell the difference between facts, fiction, beliefs, and hypotheticals? A working prototype using lambda calculus and modal logic for structured memory with possible worlds.',
    tags: ['lambda calculus', 'knowledge representation', 'modal logic', 'AI memory'],
    icon: 'λ',
    gradient: 'from-violet-500 to-indigo-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '25 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'compression-discovers-cognition',
    title: "Compression Discovers Cognition: How MDL Rediscovers Schank's Primitives",
    description: 'How Minimum Description Length pressure in a wake-sleep loop independently recovers Schankian primitives from event data.',
    tags: ['Schankian', 'MDL', 'compression', 'wake-sleep'],
    icon: '🗜️',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'mamba-state-space-models',
    title: 'Mamba: The Selective Memory Machine',
    description: 'How state-space models with selective mechanisms achieve transformer-quality results at linear complexity.',
    tags: ['architecture', 'SSM', 'Mamba', 'sequence modeling'],
    icon: '🐍',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '25 min',
    difficulty: 2,
    featured: true,
  },
  {
    id: 'holographic-residual-stream',
    title: 'The Holographic Residual Stream',
    description: 'How the residual stream encodes information holographically — every position contains a compressed version of the whole.',
    tags: ['transformers', 'residual stream', 'holographic', 'interpretability'],
    icon: '🌈',
    gradient: 'from-purple-500 to-fuchsia-600',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'sae-semantic-attractors',
    title: 'SAE Features as Semantic Attractors',
    description: 'How sparse autoencoder features act as basins of attraction in meaning space — pulling nearby representations toward stable interpretations.',
    tags: ['SAE', 'semantic', 'attractors', 'interpretability'],
    icon: '🧲',
    gradient: 'from-rose-500 to-red-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'tensor-products-for-humans',
    title: 'Tensor Products for Humans',
    description: 'Demystifying tensor products with visual intuition — from outer products to binding operations in neural networks.',
    tags: ['linear algebra', 'tensors', 'fundamentals'],
    icon: '⊗',
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'mining-sae-operators',
    title: 'Mining SAE Dictionaries for Schankian Operators',
    description: 'Searching Anthropic\'s 34M monosemantic features for Schankian primitives — a shortcut to validating the operator hypothesis.',
    tags: ['SAE', 'operators', 'Schank', 'mechanistic interpretability'],
    icon: '⛏️',
    gradient: 'from-amber-500 to-yellow-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'beam-search-interpretation',
    title: 'Beam Search on Meaning: How Minds and Machines Resolve Ambiguity',
    description: 'How beam search algorithms parallel human sentence processing — maintaining multiple interpretations until disambiguation.',
    tags: ['parsing', 'psycholinguistics', 'beam search'],
    icon: '🔦',
    gradient: 'from-sky-500 to-blue-600',
    shadowColor: 'shadow-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'diffusion-01-denoising-basics',
    title: 'Text Diffusion I: The Art of Controlled Destruction',
    description: 'Understanding diffusion from first principles — the forward process, noise schedules, and why destroying is the first step to creating.',
    tags: ['diffusion', 'text generation', 'fundamentals'],
    icon: '💨',
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'diffusion-02-pixels-to-words',
    title: 'Text Diffusion II: From Pixels to Words',
    description: 'The challenges of moving diffusion from continuous pixel space to discrete token space.',
    tags: ['diffusion', 'text generation'],
    icon: '🖼️',
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'diffusion-03-three-approaches',
    title: 'Text Diffusion III: Three Roads to Denoising Text',
    description: 'Comparing the major approaches to text diffusion — continuous embeddings, discrete corruption, and masked diffusion.',
    tags: ['diffusion', 'text generation'],
    icon: '🛤️',
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'diffusion-04-brownian-bridge',
    title: 'Text Diffusion IV: The Brownian Bridge — Why Endpoints Change Everything',
    description: 'How conditioning diffusion on both start and end points creates controllable text transformations.',
    tags: ['diffusion', 'Brownian bridge', 'text generation'],
    icon: '🌉',
    gradient: 'from-blue-500 to-purple-600',
    shadowColor: 'shadow-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'predictive-coding-free-energy',
    title: 'Predictive Coding Under the Free-Energy Principle',
    description: 'Friston\'s theory of the brain as a prediction machine — minimizing surprise through hierarchical generative models.',
    tags: ['neuroscience', 'predictive coding', 'Friston', 'free energy'],
    icon: '🧠',
    gradient: 'from-purple-500 to-pink-600',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '25 min',
    difficulty: 3,
  },
  {
    id: 'sausage-machine-parsing',
    title: 'The Sausage Machine: How Your Brain Parses Sentences',
    description: 'Frazier\'s garden-path theory of human sentence processing — and why some sentences make your brain stumble.',
    tags: ['psycholinguistics', 'parsing', 'Frazier'],
    icon: '🌭',
    gradient: 'from-orange-500 to-red-600',
    shadowColor: 'shadow-orange-500/30',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'surprisal-theory-levy',
    title: 'Surprisal Theory: Why Some Words Stop You in Your Tracks',
    description: 'How information-theoretic surprise predicts reading times — the elegant link between probability and processing difficulty.',
    tags: ['psycholinguistics', 'information theory', 'surprisal'],
    icon: '😮',
    gradient: 'from-rose-500 to-pink-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'probabilistic-parsing-jurafsky',
    title: "Probabilistic Parsing: Your Brain's Betting System",
    description: 'How the brain uses probabilistic cues to parse sentences in real time — frequency, context, and competition.',
    tags: ['psycholinguistics', 'parsing', 'probabilistic'],
    icon: '🎲',
    gradient: 'from-violet-500 to-indigo-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'competition-model-bates',
    title: 'The Competition Model: How Languages Fight Over Meaning',
    description: 'Bates and MacWhinney\'s theory that language processing is a competition between cues — and why different languages weight cues differently.',
    tags: ['psycholinguistics', 'competition model', 'cross-linguistic'],
    icon: '⚔️',
    gradient: 'from-red-500 to-orange-600',
    shadowColor: 'shadow-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'complexity-metrics-cheung-kemper',
    title: 'Measuring Sentence Complexity: Yngve Depth and Frazier Count',
    description: 'Two classic metrics for quantifying syntactic complexity — and why they disagree in interesting ways.',
    tags: ['psycholinguistics', 'complexity', 'parsing'],
    icon: '📏',
    gradient: 'from-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'either-or-prediction-staub-clifton',
    title: 'Either...Or: How One Word Changes Everything',
    description: 'How correlative conjunctions create strong predictions — and what happens when those predictions are violated.',
    tags: ['psycholinguistics', 'prediction', 'parsing'],
    icon: '⚖️',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '18 min',
    difficulty: 2,
  },
  {
    id: 'fodor-learning-to-parse',
    title: 'Learning to Parse: Prosody, Weight, and the Sausage Machine Revisited',
    description: 'How children learn parsing strategies from prosodic cues and constituent weight — Fodor\'s updated theory.',
    tags: ['psycholinguistics', 'parsing', 'prosody', 'acquisition'],
    icon: '🎵',
    gradient: 'from-indigo-500 to-violet-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '20 min',
    difficulty: 3,
  },
  {
    id: 'hagoort-unification-model',
    title: "Hagoort's Unification Model and the N400/P600 Dissociation",
    description: 'How the brain dissociates semantic (N400) and syntactic (P600) processing — and what it means for language architecture.',
    tags: ['neurolinguistics', 'ERP', 'N400', 'P600', 'unification'],
    icon: '⚡',
    gradient: 'from-yellow-500 to-amber-600',
    shadowColor: 'shadow-yellow-500/30',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'local-coherence-kukona',
    title: "Local Coherence: When Words Don't Listen to Context",
    description: 'How local word associations can override global sentence meaning — and what this tells us about parallel processing.',
    tags: ['psycholinguistics', 'coherence', 'parsing'],
    icon: '🔗',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '18 min',
    difficulty: 2,
  },
  {
    id: 'phillips-three-benchmarks',
    title: 'Three Benchmarks: The Test Every Parsing Theory Must Pass',
    description: 'Phillips\' three challenges for any theory of human sentence processing — incrementality, prediction, and reanalysis.',
    tags: ['psycholinguistics', 'benchmarks', 'parsing'],
    icon: '✅',
    gradient: 'from-green-500 to-emerald-600',
    shadowColor: 'shadow-green-500/30',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'thematic-role-prediction-altmann',
    title: 'Thematic Role Prediction: How Verbs Set the Table',
    description: 'How verbs create expectations about upcoming arguments — and how the brain uses these predictions in real-time processing.',
    tags: ['psycholinguistics', 'thematic roles', 'prediction'],
    icon: '🍽️',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'verb-sense-subcat-roland-jurafsky',
    title: 'Verb Sense and Subcategorization: Why "Worry" Worries Differently',
    description: 'How verb senses predict different argument structures — and what this means for parsing and generation.',
    tags: ['psycholinguistics', 'verbs', 'subcategorization'],
    icon: '📖',
    gradient: 'from-teal-500 to-emerald-600',
    shadowColor: 'shadow-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'implicit-explicit-enrichment',
    title: 'Implicit-Explicit Document Enrichment',
    description: 'Making the invisible visible — enriching documents with explicit annotations of implied information.',
    tags: ['NLP', 'enrichment', 'annotation'],
    icon: '📝',
    gradient: 'from-slate-500 to-gray-600',
    shadowColor: 'shadow-slate-500/30',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'inner-product-unification',
    title: 'The Shadow on the Wall: How One Operation Connects Everything',
    description: 'How the inner product unifies projection, similarity, attention, and quantum measurement — one operation to rule them all.',
    tags: ['linear algebra', 'inner product', 'unification'],
    icon: '🔮',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '22 min',
    difficulty: 2,
  },
  {
    id: 'kernel-arithmetic-with-matrices',
    title: 'Kernel Arithmetic with Matrices',
    description: 'How kernel methods lift linear operations into infinite-dimensional feature spaces — making nonlinear problems linear.',
    tags: ['linear algebra', 'kernels', 'matrices'],
    icon: '🔢',
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'vector-transformations-tour',
    title: 'Beyond Linear: A Whirlwind Tour of Vector Transformations & Projections',
    description: 'Interactive exploration of rotations, reflections, projections, and nonlinear transformations in 2D and 3D.',
    tags: ['linear algebra', 'transformations', 'visualization'],
    icon: '🎢',
    gradient: 'from-pink-500 to-rose-600',
    shadowColor: 'shadow-pink-500/30',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '20 min',
    difficulty: 2,
  },
  {
    id: 'transformerlens-explained-simply-at-first-eli5-eli',
    title: 'TransformerLens: Your X-Ray Vision into AI Models',
    description: 'The simplest possible introduction to TransformerLens — hook into any layer, read any activation, understand any prediction.',
    tags: ['mechanistic interpretability', 'TransformerLens', 'ELI5'],
    icon: '🔬',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '15 min',
    difficulty: 1,
  },
  {
    id: 'dgoim-modal-knowledge-store',
    title: 'Token-Guided AI Memory: From Lambda Calculus to Modal Knowledge Stores',
    description: 'How a graph-rewriting abstract machine from proof theory gives AI systems structured, provenance-tracked memory with beliefs, fiction, and uncertainty.',
    tags: ['lambda calculus', 'geometry of interaction', 'knowledge representation', 'AI memory', 'modal logic'],
    icon: '🧠',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    readTime: '45 min',
    difficulty: 3,
    featured: true,
  },
  {
    id: 'brainstorm-102-epistemic-regress',
    title: 'The Epistemic Regress of Operator Discovery',
    description: 'How epistemology\'s oldest problem — the infinite justification chain — maps onto Schankian operator discovery. Russell\'s acquaintance/description distinction provides foundations that stop the regress.',
    tags: ['epistemology', 'foundationalism', 'Russell', 'symbol grounding', 'Gettier', 'operators'],
    icon: '🏛️',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '22 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-87-routing-primitive-selectors',
    title: 'Routing Programs as Primitive Selectors',
    description: 'Is the MLP exception handler a Schankian dispatcher? The 27-neuron routing program in GPT-2 may literally select which conceptual primitive applies to each token — connecting mech interp to cognitive science.',
    tags: ['mechanistic interpretability', 'Schankian primitives', 'MLP routing', 'transformers', 'Hydra'],
    icon: '🔀',
    gradient: 'from-rose-500 to-red-600',
    shadowColor: 'shadow-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    readTime: '15 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-88-operator-remapping-place-cells',
    title: 'Operator Remapping: Primitives as Place Cells',
    description: 'Hippocampal place cells remap when context changes — what if Schankian primitives do the same? ATRANS in a courtroom has different argument structure, temporal profile, and inference chain than ATRANS on a playground. Same topological role, different geometry.',
    tags: ['neuroscience', 'Schankian primitives', 'manifold theory', 'Hydra', 'cognitive maps'],
    icon: '🧠',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '30 min',
    difficulty: 3,
  },
  {
    id: 'brainstorm-89-consensus-typed-failure',
    title: 'Consensus as Typed Expectation Failure',
    description: 'The 7 consensus neurons in GPT-2 decompose scalar surprisal into a 7-bit typed failure fingerprint — structurally implementing Schank\'s failure-driven memory. Different dropout patterns identify different KINDS of expectation failure, predicting different Schankian repair primitives.',
    tags: ['mechanistic interpretability', 'Schankian primitives', 'event segmentation', 'consensus neurons'],
    icon: '🔔',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '18 min',
    difficulty: 3,
  },
  {
    id: 'sgd-to-spectra-weight-dynamics',
    title: 'From SGD to Spectra: Weight Matrix Dynamics',
    description: 'A weight matrix is a fuzzy hashmap — but what SHAPE is the hashmap? How training sculpts the spectrum of singular values, why eigenvalues repel like charged particles, and what the bulk+tail structure tells you about learning. Based on Fatehmanesh et al. (2025).',
    tags: ['linear algebra', 'training dynamics', 'random matrix theory', 'transformers'],
    icon: '📊',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '35 min',
    difficulty: 2,
  },
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
const difficultyStars = (level) => { const l = Math.max(0, Math.min(3, level || 0)); return '★'.repeat(l) + '☆'.repeat(3 - l) }

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
function TutorialListItem({ tutorial, showDate = false }) {
  const linkPath = tutorial.isApp ? `/${tutorial.id}` : `/tutorial/${tutorial.id}`
  const ts = tutorialTimestamps[tutorial.id]
  const dateStr = ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
  
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
            {showDate && dateStr && (
              <span className="text-xs text-indigo-400 flex-shrink-0">{dateStr}</span>
            )}
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

// Sort dropdown
function SortDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600
        focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm
        hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <option value="default">Default order</option>
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="alpha">A → Z</option>
      <option value="alpha-desc">Z → A</option>
      <option value="difficulty-asc">Easiest first</option>
      <option value="difficulty-desc">Hardest first</option>
    </select>
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

// Highlight matching text
function HighlightText({ text, query }) {
  if (!query) return <>{text}</>
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function SearchBar({ value, onChange, inputRef }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search tutorials… (⌘K or /)"
        className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl
          text-gray-800 placeholder-gray-400
          focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          shadow-sm hover:shadow-md transition-all duration-200 text-[15px]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

function SearchResults({ results, query }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-500 text-lg">No tutorials found for "<span className="font-medium text-gray-700">{query}</span>"</p>
        <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500 mb-1">{results.length} result{results.length !== 1 ? 's' : ''}</p>
      {results.map(({ tutorial, excerpt }) => {
        const linkPath = tutorial.isApp ? `/${tutorial.id}` : `/tutorial/${tutorial.id}`
        return (
          <Link key={tutorial.id} to={linkPath} className="group block no-underline">
            <div className="p-5 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tutorial.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-lg">{tutorial.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    <HighlightText text={tutorial.title} query={query} />
                  </h3>
                  {excerpt && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      <HighlightText text={excerpt} query={query} />
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tutorial.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tagColors[tag] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default function Listing() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortMode, setSortMode] = useState('default')
  const [allTutorials, setAllTutorials] = useState(tutorials)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const { search, isBuilding } = useSearchIndex(allTutorials)
  const searchResults = searchQuery.trim() ? search(searchQuery) : []
  const isSearchActive = searchQuery.trim().length > 0

  // Sort tutorials
  const sortedTutorials = useMemo(() => {
    const arr = [...allTutorials]
    switch (sortMode) {
      case 'newest':
        return arr.sort((a, b) => {
          const ta = tutorialTimestamps[a.id] || ''
          const tb = tutorialTimestamps[b.id] || ''
          return tb.localeCompare(ta)
        })
      case 'oldest':
        return arr.sort((a, b) => {
          const ta = tutorialTimestamps[a.id] || ''
          const tb = tutorialTimestamps[b.id] || ''
          return ta.localeCompare(tb)
        })
      case 'alpha':
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      case 'alpha-desc':
        return arr.sort((a, b) => b.title.localeCompare(a.title))
      case 'difficulty-asc':
        return arr.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0))
      case 'difficulty-desc':
        return arr.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))
      default:
        return arr
    }
  }, [allTutorials, sortMode])

  // Keyboard shortcut: Cmd+K or /
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName))) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchQuery])

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
        {/* Search bar */}
        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} inputRef={searchInputRef} />
        </div>

        {isSearchActive ? (
          <SearchResults results={searchResults} query={searchQuery} />
        ) : (
        <>
        {/* Sort + View toggle */}
        <div className="flex items-center justify-between mb-4">
          <SortDropdown value={sortMode} onChange={setSortMode} />
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedTutorials.map((tutorial, i) => (
              <TutorialCard 
                key={tutorial.id} 
                tutorial={tutorial}
                featured={i === 0 && sortMode === 'default'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedTutorials.map((tutorial) => (
              <TutorialListItem key={tutorial.id} tutorial={tutorial} showDate={sortMode === 'newest' || sortMode === 'oldest'} />
            ))}
          </div>
        )}
        </>
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
