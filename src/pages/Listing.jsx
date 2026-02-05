import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Header, Card, Badge } from '../components/SharedUI.jsx'

const tutorials = [
  {
    id: 'engine-demo',
    title: '🧪 Tutorial Engine Demo',
    description: 'A self-documenting demonstration of the data-driven tutorial system with live state bindings',
    tags: ['experimental', 'meta', 'tutorial-engine'],
    featured: true
  },
  {
    id: 'lead-lag-correlation',
    title: 'Lead-Lag Correlation',
    description: 'Discover predictive relationships in time series data with cross-correlation analysis',
    tags: ['time series', 'correlation', 'quantitative finance']
  },
  {
    id: 'vector-projection',
    title: 'Vector Projection',
    description: 'Interactive exploration of projecting one 2D vector onto another with drag-and-drop visualization',
    tags: ['vectors', 'linear algebra', 'fundamentals']
  },
  {
    id: 'matrix-discovery',
    title: 'Matrix Discovery',
    description: 'Interactive tool for discovering transformation matrices from input-output pairs',
    tags: ['matrices', 'linear algebra', 'clustering']
  },
  {
    id: 'matrix-from-vectors',
    title: 'Matrix from Vectors',
    description: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    tags: ['linear algebra', 'vectors', 'visualization']
  },
  {
    id: 'least-squares',
    title: 'Least Squares Regression',
    description: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    tags: ['regression', 'statistics', 'optimization']
  }
]

export default function Listing() {
  return (
    <Container className="py-16" size="wide">
      <Header 
        title="Tutorials"
        subtitle="Interactive learning experiences for understanding AI, math, and data concepts"
        align="center"
        size="large"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {tutorials.map(tutorial => (
          <Link 
            key={tutorial.id}
            to={`/tutorial/${tutorial.id}`}
            className="group no-underline"
          >
            <Card 
              variant="default" 
              className="h-full hover:shadow-xl hover:border-gray-300 transition-all duration-200 cursor-pointer group-hover:-translate-y-1"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {tutorial.title}
              </h2>
              <p className="text-gray-600 mb-5 leading-relaxed">
                {tutorial.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {tutorial.tags.map(tag => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
