/**
 * useVisualize Hook
 * 
 * Connects selected text to the visualization template system via AI analysis.
 * 
 * Usage:
 *   const { visualize, isLoading, result, error, clearResult } = useVisualize()
 *   
 *   // When user clicks "Visualize"
 *   await visualize(selectedText, contextText)
 *   
 *   // result will be:
 *   // { canVisualize: true, template: 'vector-2d', config: {...}, explanation: '...' }
 *   // or
 *   // { canVisualize: false, reason: 'This concept is abstract...' }
 */

import { useState, useCallback } from 'react'
import { getTemplateDescriptions, validateConfig } from './index.jsx'

/**
 * Build the prompt for the AI
 */
function buildPrompt(selectedText, context) {
  const templates = getTemplateDescriptions()
  
  const templateDocs = templates.map(t => 
    `### ${t.name}\n` +
    `Description: ${t.description}\n` +
    `Keywords: ${t.keywords.join(', ')}\n` +
    `Config: ${JSON.stringify(t.configSchema, null, 2)}\n` +
    `Example: ${JSON.stringify(t.examples[0]?.config || {})}`
  ).join('\n\n')

  return `You are a visualization assistant for an educational math/ML tutorial platform.

Given selected text from a tutorial, determine if it can be visualized with one of the available templates.

## Available Templates

${templateDocs}

## Your Task

Analyze the selected text and surrounding context. If the concept can be meaningfully visualized:
1. Choose the most appropriate template
2. Generate a configuration that illustrates the concept
3. Provide a brief explanation of what the visualization shows

If the concept is too abstract or doesn't map well to any template, explain why.

## Selected Text
"${selectedText}"

## Context
${context.slice(0, 800)}

## Response Format (JSON only)
If visualizable:
{
  "canVisualize": true,
  "template": "<template-name>",
  "config": { <template-specific config> },
  "explanation": "<brief explanation of what visualization shows>"
}

If not visualizable:
{
  "canVisualize": false,
  "reason": "<explanation of why this can't be effectively visualized>"
}

Respond with only valid JSON, no markdown code blocks.`
}

/**
 * Parse AI response, handling potential JSON issues
 */
function parseResponse(text) {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('Failed to parse AI response:', text)
    return {
      canVisualize: false,
      reason: 'Failed to parse AI response. Please try again.'
    }
  }
}

/**
 * Hook for visualization generation
 */
export function useVisualize(aiEndpoint = '/api/visualize') {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const visualize = useCallback(async (selectedText, context = '') => {
    if (!selectedText?.trim()) {
      setError('No text selected')
      return null
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const prompt = buildPrompt(selectedText, context)
      
      // Call AI endpoint
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, selectedText, context })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Parse the AI response
      const parsed = typeof data.result === 'string' 
        ? parseResponse(data.result)
        : data.result || data

      // Validate if we got a visualization
      if (parsed.canVisualize && parsed.template) {
        const validation = validateConfig(parsed.template, parsed.config || {})
        if (!validation.valid) {
          console.warn('Config validation warnings:', validation.errors)
        }
      }

      setResult(parsed)
      return parsed

    } catch (err) {
      console.error('Visualization error:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [aiEndpoint])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    visualize,
    isLoading,
    result,
    error,
    clearResult
  }
}

/**
 * Mock visualize for development/testing
 * Simulates AI response based on keywords
 */
export function useMockVisualize() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const visualize = useCallback(async (selectedText, context = '') => {
    setIsLoading(true)
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800))
    
    const text = (selectedText + ' ' + context).toLowerCase()
    
    let mockResult
    
    // Simple keyword matching for mock
    if (text.includes('vector') || text.includes('projection') || text.includes('dot product')) {
      mockResult = {
        canVisualize: true,
        template: 'vector-2d',
        config: {
          vectorA: [3, 2],
          vectorB: [4, 0],
          showProjection: text.includes('projection'),
          showDotProduct: text.includes('dot'),
          showAngle: true,
          draggable: true,
        },
        explanation: 'This visualization shows two vectors and their geometric relationship. Drag the endpoints to explore how the projection changes.'
      }
    } else if (text.includes('regression') || text.includes('least squares') || text.includes('best fit')) {
      mockResult = {
        canVisualize: true,
        template: 'scatter-plot',
        config: {
          points: [
            {x: 1, y: 2}, {x: 2, y: 3.8}, {x: 3, y: 4.2},
            {x: 4, y: 5.5}, {x: 5, y: 6.1}, {x: 6, y: 7.3}
          ],
          showLine: true,
          showResiduals: text.includes('residual') || text.includes('error'),
          interactive: true,
        },
        explanation: 'This scatter plot shows data points with the best-fit regression line. Click to add more points and see how the line adjusts.'
      }
    } else if (text.includes('complex') || text.includes('rotation') || text.includes('euler') || text.includes('e^i')) {
      mockResult = {
        canVisualize: true,
        template: 'complex-plane',
        config: {
          angle: 45,
          showFormula: true,
          animatable: true,
        },
        explanation: 'This shows rotation in the complex plane using Euler\'s formula. Use the slider or animate to see how e^(iθ) rotates the point.'
      }
    } else if (text.includes('bar') || text.includes('distribution') || text.includes('frequency') || text.includes('histogram')) {
      mockResult = {
        canVisualize: true,
        template: 'bar-chart',
        config: {
          data: [
            {label: 'A', value: 15},
            {label: 'B', value: 28},
            {label: 'C', value: 12},
            {label: 'D', value: 22},
          ],
          colorByValue: true,
          showValues: true,
        },
        explanation: 'A bar chart comparing categorical values.'
      }
    } else if (text.includes('time series') || text.includes('trend') || text.includes('signal') || text.includes('wave')) {
      mockResult = {
        canVisualize: true,
        template: 'line-chart',
        config: {
          data: [1, 3, 2, 5, 4, 6, 5, 7, 6, 8],
          showPoints: true,
          fillArea: true,
          lineColor: '#6366f1',
        },
        explanation: 'A line chart showing the trend over time.'
      }
    } else {
      mockResult = {
        canVisualize: false,
        reason: 'This concept is abstract and doesn\'t map well to the available visualization templates. It may require a custom visualization or is better explained through text/equations.'
      }
    }
    
    setResult(mockResult)
    setIsLoading(false)
    return mockResult
  }, [])

  const clearResult = useCallback(() => setResult(null), [])

  return {
    visualize,
    isLoading,
    result,
    error: null,
    clearResult
  }
}

export default useVisualize
