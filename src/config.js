// Annotation server URL — uses env var in production (Cloudflare tunnel), falls back to localhost for dev
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5190'
