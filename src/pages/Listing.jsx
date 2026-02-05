import React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/SharedUI.jsx'

const tutorials = [
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
    featured: true,
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
  }
]

// Semantic tag color system - filled backgrounds
const tagColors = {
  // Status tags - special styling
  'experimental': 'bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent',
  'meta': 'bg-violet-100 text-violet-700 border-violet-200',
  'tutorial-engine': 'bg-purple-100 text-purple-700 border-purple-200',
  
  // Difficulty
  'fundamentals': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  
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
}

// Difficulty display
const difficultyLabels = ['Beginner', 'Intermediate', 'Advanced']
const difficultyStars = (level) => '★'.repeat(level) + '☆'.repeat(3 - level)

function TutorialCard({ tutorial, featured = false }) {
  return (
    <Link 
      to={`/tutorial/${tutorial.id}`}
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

export default function Listing() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <style>{heroStyles}</style>
      
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
              <span>6 tutorials</span>
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
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafafa] to-transparent" />
      </header>
      
      {/* Tutorial Grid */}
      <Container size="wide" className="py-12 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutorials.map((tutorial, i) => (
            <TutorialCard 
              key={tutorial.id} 
              tutorial={tutorial}
              featured={i === 0}
            />
          ))}
        </div>
        
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
