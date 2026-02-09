/**
 * Visualization Template Registry
 * 
 * This module provides a template-based system for generating visualizations
 * from structured configurations. AI can select templates and provide config,
 * without needing to generate React code directly.
 * 
 * Usage:
 *   import { getTemplate, renderVisualization, templates } from './templates'
 *   
 *   // Get template info
 *   const info = getTemplate('vector-2d')
 *   
 *   // Render a visualization from config
 *   const element = renderVisualization({
 *     template: 'vector-2d',
 *     config: { vectorA: [3, 2], vectorB: [4, 0], showProjection: true }
 *   })
 */

import React from 'react'

// Template implementations
import { Vector2DTemplate } from './Vector2DTemplate'
import { ScatterPlotTemplate } from './ScatterPlotTemplate'
import { ComplexPlaneTemplate } from './ComplexPlaneTemplate'
import { BarChartTemplate } from './BarChartTemplate'
import { LineChartTemplate } from './LineChartTemplate'

/**
 * Template Registry
 * Each template has:
 * - component: React component to render
 * - description: What this template visualizes
 * - keywords: Terms that suggest this template
 * - configSchema: Expected configuration structure
 * - examples: Sample configs for AI reference
 */
export const templates = {
  'vector-2d': {
    component: Vector2DTemplate,
    description: 'Interactive 2D vectors with projection, dot product, and angle visualization',
    keywords: ['vector', 'projection', 'dot product', 'angle', 'direction', 'magnitude', 'orthogonal', 'perpendicular', 'component'],
    configSchema: {
      vectorA: { type: 'array', description: '[x, y] coordinates for vector a', default: [3, 2] },
      vectorB: { type: 'array', description: '[x, y] coordinates for vector b', default: [4, 0] },
      showProjection: { type: 'boolean', description: 'Show projection of a onto b', default: true },
      showDotProduct: { type: 'boolean', description: 'Display dot product value', default: true },
      showAngle: { type: 'boolean', description: 'Display angle between vectors', default: true },
      draggable: { type: 'boolean', description: 'Allow dragging vector endpoints', default: true },
      labels: { type: 'object', description: 'Custom labels for vectors', default: { a: 'a', b: 'b' } },
    },
    examples: [
      {
        description: 'Basic projection visualization',
        config: { vectorA: [3, 2], vectorB: [4, 0], showProjection: true }
      },
      {
        description: 'Orthogonal vectors demo',
        config: { vectorA: [0, 3], vectorB: [4, 0], showProjection: true, showDotProduct: true }
      }
    ]
  },

  'scatter-plot': {
    component: ScatterPlotTemplate,
    description: 'Scatter plot with optional regression line and residuals',
    keywords: ['scatter', 'points', 'regression', 'line', 'fit', 'residual', 'error', 'least squares', 'correlation', 'data'],
    configSchema: {
      points: { type: 'array', description: 'Array of {x, y} objects', default: [] },
      showLine: { type: 'boolean', description: 'Show regression line', default: true },
      showResiduals: { type: 'boolean', description: 'Show residual lines', default: false },
      interactive: { type: 'boolean', description: 'Allow clicking to add points', default: true },
      lineColor: { type: 'string', description: 'Color for regression line', default: '#6366f1' },
      pointColor: { type: 'string', description: 'Color for data points', default: '#22c55e' },
    },
    examples: [
      {
        description: 'Linear regression with residuals',
        config: { 
          points: [{x:1,y:2}, {x:2,y:4}, {x:3,y:5}, {x:4,y:4}, {x:5,y:6}],
          showLine: true,
          showResiduals: true
        }
      }
    ]
  },

  'complex-plane': {
    component: ComplexPlaneTemplate,
    description: 'Complex number visualization with rotation by e^(iθ)',
    keywords: ['complex', 'rotation', 'euler', 'imaginary', 'angle', 'phase', 'e^iθ', 'unit circle'],
    configSchema: {
      angle: { type: 'number', description: 'Initial rotation angle in degrees', default: 45 },
      showFormula: { type: 'boolean', description: 'Show Euler formula', default: true },
      animatable: { type: 'boolean', description: 'Show animation controls', default: true },
      point: { type: 'array', description: '[real, imag] of starting point', default: [1, 0] },
    },
    examples: [
      {
        description: '45 degree rotation',
        config: { angle: 45, showFormula: true }
      },
      {
        description: '90 degree rotation (multiply by i)',
        config: { angle: 90, showFormula: true }
      }
    ]
  },

  'bar-chart': {
    component: BarChartTemplate,
    description: 'Vertical bar chart for categorical comparisons',
    keywords: ['bar', 'chart', 'comparison', 'category', 'histogram', 'frequency', 'distribution'],
    configSchema: {
      data: { type: 'array', description: 'Array of {label, value} or just numbers', default: [] },
      colorByValue: { type: 'boolean', description: 'Color bars by their value (green=high)', default: false },
      showValues: { type: 'boolean', description: 'Show value labels on bars', default: true },
      title: { type: 'string', description: 'Chart title', default: '' },
    },
    examples: [
      {
        description: 'Simple value comparison',
        config: { 
          data: [{label: 'A', value: 10}, {label: 'B', value: 25}, {label: 'C', value: 15}],
          showValues: true
        }
      }
    ]
  },

  'line-chart': {
    component: LineChartTemplate,
    description: 'Line chart for time series or sequential data',
    keywords: ['line', 'time series', 'trend', 'sequence', 'temporal', 'signal', 'wave'],
    configSchema: {
      data: { type: 'array', description: 'Array of numbers or {x, y} objects', default: [] },
      showPoints: { type: 'boolean', description: 'Show data point markers', default: true },
      lineColor: { type: 'string', description: 'Color for the line', default: '#6366f1' },
      fillArea: { type: 'boolean', description: 'Fill area under the line', default: false },
      title: { type: 'string', description: 'Chart title', default: '' },
    },
    examples: [
      {
        description: 'Simple trend',
        config: { data: [1, 3, 2, 5, 4, 6, 5], showPoints: true }
      }
    ]
  },
}

/**
 * Get template info by name
 */
export function getTemplate(name) {
  return templates[name] || null
}

/**
 * List all available template names
 */
export function listTemplates() {
  return Object.keys(templates)
}

/**
 * Get template metadata for AI prompt
 */
export function getTemplateDescriptions() {
  return Object.entries(templates).map(([name, t]) => ({
    name,
    description: t.description,
    keywords: t.keywords,
    configSchema: t.configSchema,
    examples: t.examples,
  }))
}

/**
 * Render a visualization from a spec
 * @param {Object} spec - { template: string, config: object }
 * @returns {React.Element|null}
 */
export function renderVisualization(spec) {
  if (!spec || !spec.template) {
    console.warn('renderVisualization: No template specified')
    return null
  }

  const template = templates[spec.template]
  if (!template) {
    console.warn(`renderVisualization: Unknown template "${spec.template}"`)
    return null
  }

  const Component = template.component
  const config = spec.config || {}

  return <Component {...config} />
}

/**
 * Validate a config against a template's schema
 * Returns { valid: boolean, errors: string[] }
 */
export function validateConfig(templateName, config) {
  const template = templates[templateName]
  if (!template) {
    return { valid: false, errors: [`Unknown template: ${templateName}`] }
  }

  const errors = []
  const schema = template.configSchema

  for (const [key, def] of Object.entries(schema)) {
    if (config[key] !== undefined) {
      // Type checking
      const expectedType = def.type
      const actualType = Array.isArray(config[key]) ? 'array' : typeof config[key]
      if (expectedType !== actualType) {
        errors.push(`${key}: expected ${expectedType}, got ${actualType}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export default templates
