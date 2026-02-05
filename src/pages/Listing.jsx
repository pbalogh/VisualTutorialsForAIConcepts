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
  },
  {
    id: 'lead-lag-correlation',
    title: 'Lead-Lag Correlation',
    description: 'Discover predictive relationships in time series data with cross-correlation analysis',
    tags: ['time series', 'correlation', 'quantitative finance'],
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'vector-projection',
    title: 'Vector Projection',
    description: 'Interactive exploration of projecting one 2D vector onto another with drag-and-drop visualization',
    tags: ['vectors', 'linear algebra', 'fundamentals'],
    icon: '↗️',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'matrix-discovery',
    title: 'Matrix Discovery',
    description: 'Interactive tool for discovering transformation matrices from input-output pairs',
    tags: ['matrices', 'linear algebra', 'clustering'],
    icon: '🔢',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'matrix-from-vectors',
    title: 'Matrix from Vectors',
    description: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    tags: ['linear algebra', 'vectors', 'visualization'],
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'least-squares',
    title: 'Least Squares Regression',
    description: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    tags: ['regression', 'statistics', 'optimization'],
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
  }
]

// Tag color mapping
const tagColors = {
  'experimental': 'bg-rose-50 text-rose-700 border-rose-200',
  'meta': 'bg-violet-50 text-violet-700 border-violet-200',
  'tutorial-engine': 'bg-purple-50 text-purple-700 border-purple-200',
  'time series': 'bg-blue-50 text-blue-700 border-blue-200',
  'correlation': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'quantitative finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'vectors': 'bg-teal-50 text-teal-700 border-teal-200',
  'linear algebra': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'fundamentals': 'bg-slate-100 text-slate-700 border-slate-200',
  'matrices': 'bg-orange-50 text-orange-700 border-orange-200',
  'clustering': 'bg-amber-50 text-amber-700 border-amber-200',
  'visualization': 'bg-pink-50 text-pink-700 border-pink-200',
  'regression': 'bg-sky-50 text-sky-700 border-sky-200',
  'statistics': 'bg-lime-50 text-lime-700 border-lime-200',
  'optimization': 'bg-green-50 text-green-700 border-green-200',
}

function TutorialCard({ tutorial }) {
  return (
    <Link 
      to={`/tutorial/${tutorial.id}`}
      className="group block no-underline"
    >
      <div className="h-full bg-white rounded-2xl p-8
        shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_40px_rgba(0,0,0,0.03)]
        hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_30px_60px_rgba(0,0,0,0.08)]
        border border-gray-100 hover:border-blue-200
        transition-all duration-300 ease-out
        cursor-pointer
        group-hover:-translate-y-1"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tutorial.gradient}
          flex items-center justify-center mb-6
          group-hover:scale-110 transition-transform duration-300
          shadow-lg`}
        >
          <span className="text-2xl">{tutorial.icon}</span>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 
          group-hover:text-blue-600 transition-colors duration-200
          tracking-tight"
        >
          {tutorial.title}
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mt-3 leading-relaxed text-sm">
          {tutorial.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
          {tutorial.tags.map(tag => (
            <span 
              key={tag}
              className={`inline-flex items-center px-3 py-1 
                rounded-full text-xs font-medium
                border
                transition-colors duration-200
                ${tagColors[tag] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default function Listing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
            Tutorials
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 mt-6 max-w-2xl mx-auto font-light leading-relaxed">
            Interactive learning experiences for understanding AI, math, and data concepts
          </p>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </header>
      
      {/* Tutorial Grid */}
      <Container size="wide" className="py-12 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map(tutorial => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      </Container>
    </div>
  )
}
