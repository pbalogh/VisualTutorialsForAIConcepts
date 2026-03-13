/**
 * AI Client Configuration
 * 
 * Abstracts the AI provider (Bedrock vs Anthropic direct) behind a single interface.
 * Edit this file to switch providers.
 */

// ============================================================================
// CONFIGURATION - Edit these values to switch providers
// ============================================================================

export const AI_CONFIG = {
  // Provider: 'bedrock' | 'anthropic' | 'openclaw'
  provider: 'openclaw',
  
  // Model settings per provider
  bedrock: {
    model: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    region: 'us-east-1',
    // Uses AWS CLI credentials (aws configure)
  },
  
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    // API key from environment: ANTHROPIC_API_KEY
  },

  openclaw: {
    // Uses OpenClaw's existing auth (OAuth token via CLI)
    // Requires `openclaw` to be installed and authenticated
    nodePath: '/opt/homebrew/bin/node',
  },
  
  // Shared settings
  maxTokens: 8192,
}

// ============================================================================
// IMPLEMENTATION - No need to edit below this line
// ============================================================================

import fs from 'fs/promises'
import https from 'https'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Call AI with the configured provider
 */
export async function callAI(systemPrompt, userPrompt) {
  if (AI_CONFIG.provider === 'bedrock') {
    return callBedrock(systemPrompt, userPrompt)
  } else if (AI_CONFIG.provider === 'anthropic') {
    return callAnthropic(systemPrompt, userPrompt)
  } else if (AI_CONFIG.provider === 'openclaw') {
    return callOpenClaw(systemPrompt, userPrompt)
  } else {
    throw new Error(`Unknown AI provider: ${AI_CONFIG.provider}`)
  }
}

/**
 * Get current AI configuration info
 */
export function getAIInfo() {
  const config = AI_CONFIG
  if (config.provider === 'bedrock') {
    return {
      provider: 'AWS Bedrock',
      model: config.bedrock.model,
      region: config.bedrock.region,
    }
  } else if (config.provider === 'openclaw') {
    return {
      provider: 'OpenClaw (local proxy)',
      model: 'via openclaw agent',
    }
  } else {
    return {
      provider: 'Anthropic Direct',
      model: config.anthropic.model,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    }
  }
}

// ============================================================================
// Provider implementations
// ============================================================================

async function callBedrock(systemPrompt, userPrompt) {
  const { model, region } = AI_CONFIG.bedrock
  
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: AI_CONFIG.maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  }
  
  // Write payload to temp file to avoid shell encoding issues
  const tempFile = path.join(__dirname, '.bedrock-payload.json')
  const outputFile = path.join(__dirname, '.bedrock-output.json')
  
  try {
    await fs.writeFile(tempFile, JSON.stringify(payload))
    
    execSync(`aws bedrock-runtime invoke-model \
      --model-id "${model}" \
      --region "${region}" \
      --body "fileb://${tempFile}" \
      --content-type "application/json" \
      --accept "application/json" \
      "${outputFile}"`, { stdio: 'pipe' })
    
    const output = await fs.readFile(outputFile, 'utf-8')
    const response = JSON.parse(output)
    
    if (response.content && response.content[0]) {
      return response.content[0].text
    } else {
      throw new Error(`Unexpected response format`)
    }
    
  } finally {
    await fs.unlink(tempFile).catch(() => {})
    await fs.unlink(outputFile).catch(() => {})
  }
}

async function callAnthropic(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }
  
  const { model } = AI_CONFIG.anthropic
  
  const requestBody = JSON.stringify({
    model,
    max_tokens: AI_CONFIG.maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            reject(new Error(parsed.error.message))
          } else if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text)
          } else {
            reject(new Error(`Unexpected response: ${data.slice(0, 200)}`))
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`))
        }
      })
    })
    
    req.on('error', reject)
    req.write(requestBody)
    req.end()
  })
}

async function callOpenClaw(systemPrompt, userPrompt) {
  const { nodePath } = AI_CONFIG.openclaw
  const openclawPath = '/opt/homebrew/bin/openclaw'
  
  // Combine system + user prompt into a single message for the agent
  const combinedMessage = `[System instruction — follow this exactly]\n${systemPrompt}\n\n[User request]\n${userPrompt}`
  
  // Write message to temp file to avoid shell escaping issues with large prompts
  const tempMsgFile = path.join(__dirname, `.openclaw-msg-${Date.now()}.txt`)
  
  // Use a dedicated session to avoid polluting other sessions
  const sessionId = `annotation-${Date.now()}`
  
  try {
    await fs.writeFile(tempMsgFile, combinedMessage)
    
    // Use execFileSync to avoid shell escaping issues entirely
    const { execFileSync } = await import('child_process')
    const msgContent = await fs.readFile(tempMsgFile, 'utf-8')
    
    const result = execFileSync(
      nodePath,
      [openclawPath, 'agent', '--local', '--json', '--timeout', '180', '--session-id', sessionId, '--message', msgContent],
      { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 190000,
      }
    )
    
    const parsed = JSON.parse(result)
    
    // Extract the reply text from payloads
    const textPayload = parsed.payloads?.find(p => p.text)
    if (textPayload?.text) {
      return textPayload.text
    }
    
    throw new Error(`No text in OpenClaw response: ${JSON.stringify(parsed).slice(0, 300)}`)
  } finally {
    await fs.unlink(tempMsgFile).catch(() => {})
  }
}

// ============================================================================
// Embedding support
// ============================================================================

/**
 * Generate embeddings using AWS Bedrock Titan
 * Returns a 1024-dimensional vector
 */
export async function generateEmbedding(text) {
  const { region } = AI_CONFIG.bedrock
  const model = 'amazon.titan-embed-text-v2:0'
  
  // Truncate text if too long (Titan has 8k token limit)
  const truncatedText = text.slice(0, 20000)
  
  const payload = {
    inputText: truncatedText,
    dimensions: 1024,  // Titan v2 supports 256, 512, or 1024
    normalize: true
  }
  
  const tempFile = path.join(__dirname, '.embed-payload.json')
  const outputFile = path.join(__dirname, '.embed-output.json')
  
  try {
    await fs.writeFile(tempFile, JSON.stringify(payload))
    
    execSync(`aws bedrock-runtime invoke-model \
      --model-id "${model}" \
      --region "${region}" \
      --body "fileb://${tempFile}" \
      --content-type "application/json" \
      --accept "application/json" \
      "${outputFile}"`, { stdio: 'pipe' })
    
    const output = await fs.readFile(outputFile, 'utf-8')
    const response = JSON.parse(output)
    
    if (response.embedding) {
      return response.embedding
    } else {
      throw new Error(`Unexpected embedding response format`)
    }
    
  } finally {
    await fs.unlink(tempFile).catch(() => {})
    await fs.unlink(outputFile).catch(() => {})
  }
}

/**
 * Compute cosine similarity between two embedding vectors
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error('Vectors must have same length')
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
