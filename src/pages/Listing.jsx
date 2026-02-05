import React from 'react'
import { Link } from 'react-router-dom'
import { Container, Header, Card } from '../components/SharedUI.jsx'

const tutorials = [
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
    <Container className="py-12">
      <Header 
        title="Tutorials"
        subtitle="Interactive learning experiences"
        className="text-center"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map(tutorial => (
          <Link 
            key={tutorial.id}
            to={`/tutorial/${tutorial.id}`}
            className="no-underline"
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {tutorial.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {tutorial.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {tutorial.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
