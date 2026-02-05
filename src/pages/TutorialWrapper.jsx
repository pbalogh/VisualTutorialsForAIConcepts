import React from 'react'
import { useParams, Link } from 'react-router-dom'
import MatrixDiscovery from '../tutorials/MatrixDiscovery.jsx'
import MatrixFromVectors from '../tutorials/MatrixFromVectors.jsx'
import LeastSquares from '../tutorials/LeastSquares.jsx'
import VectorProjection from '../tutorials/VectorProjection.jsx'
import LeadLagCorrelation from '../tutorials/LeadLagCorrelation.jsx'
import { Container } from '../components/SharedUI.jsx'

const tutorialComponents = {
  'matrix-discovery': MatrixDiscovery,
  'matrix-from-vectors': MatrixFromVectors,
  'least-squares': LeastSquares,
  'vector-projection': VectorProjection,
  'lead-lag-correlation': LeadLagCorrelation
}

export default function TutorialWrapper() {
  const { tutorialId } = useParams()
  const TutorialComponent = tutorialComponents[tutorialId]

  if (!TutorialComponent) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            ← Back to listing
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <div>
      <div className="border-b border-gray-200 bg-gray-50">
        <Container className="py-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to tutorials
          </Link>
        </Container>
      </div>
      <TutorialComponent />
    </div>
  )
}
