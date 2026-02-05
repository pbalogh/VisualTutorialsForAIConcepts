// ⛔ LEGACY - DO NOT USE THIS FILE
// 
// This is an old, standalone Vite config for a tutorial.
// All tutorials are now components in ~/clawd/tools/topics-ui/
// 
// See TUTORIALS_ARCHITECTURE.md for the new architecture.
// Delete this entire directory when you're done referencing old code.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5184,
    open: true
  }
})
