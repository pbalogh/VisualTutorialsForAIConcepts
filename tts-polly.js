/**
 * AWS Polly TTS Helper
 * Uses AWS CLI (already configured for Bedrock)
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = path.join(__dirname, 'public', 'audio')

// Neural voices sound much better
const VOICE_ID = 'Matthew'  // Options: Matthew, Joanna, Amy, Brian, Emma, Ivy, Kendra, Kimberly, Salli, Joey, Justin, Kevin, Ruth, Stephen
const ENGINE = 'neural'

export async function synthesizeSpeech(text, outputFilename) {
  // Ensure audio directory exists
  await fs.mkdir(AUDIO_DIR, { recursive: true })
  
  const outputPath = path.join(AUDIO_DIR, outputFilename)
  
  // Use AWS CLI to call Polly
  const command = `aws polly synthesize-speech \
    --text "${text.replace(/"/g, '\\"').replace(/\n/g, ' ')}" \
    --output-format mp3 \
    --voice-id ${VOICE_ID} \
    --engine ${ENGINE} \
    --region us-east-1 \
    "${outputPath}"`
  
  try {
    execSync(command, { stdio: 'pipe' })
    return `/audio/${outputFilename}`
  } catch (error) {
    console.error('Polly TTS error:', error.message)
    throw error
  }
}

// Generate audio for all slides in a presentation
export async function generatePresentationAudio(script, cacheKey) {
  const audioUrls = []
  
  for (let i = 0; i < script.length; i++) {
    const slide = script[i]
    if (!slide.narration) {
      audioUrls.push(null)
      continue
    }
    
    const filename = `${cacheKey}-slide-${i}.mp3`
    const audioPath = path.join(AUDIO_DIR, filename)
    
    // Check if already generated
    try {
      await fs.access(audioPath)
      console.log(`  ✅ Audio cached: slide ${i}`)
      audioUrls.push(`/audio/${filename}`)
      continue
    } catch {
      // Need to generate
    }
    
    console.log(`  🔊 Generating audio: slide ${i}`)
    const url = await synthesizeSpeech(slide.narration, filename)
    audioUrls.push(url)
  }
  
  return audioUrls
}
