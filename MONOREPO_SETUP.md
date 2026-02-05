# Tutorials Monorepo - Unified Web Server Architecture

---

## 🚨 CRITICAL RULE: READ THIS FIRST 🚨

**NEVER create a new webapp, directory, or project for a tutorial.**

All tutorials are React components in ONE place:
```
/Users/pabalogh/clawd/tutorials/generated/src/tutorials/
```

- **Port 5184** is the single dev server
- New tutorial = new .jsx file + wire into App.jsx
- That's it. Nothing else. Ever.

---

## Overview

The tutorials directory has been restructured into a **monorepo with a unified web server** using React Router. Instead of running separate dev servers for each tutorial, there is now a single Vite server that serves all tutorials with:

- **Shared dependencies** (React, TypeScript, Vite, etc.) installed once via pnpm
- **Single listing page** (`/`) showing all available tutorials
- **Dynamic routing** (`/tutorial/:tutorialId`) for individual tutorial pages
- **Shared UI library** for consistent styling across all tutorials
- **Unified build process** for deployment

## Architecture

```
~/clawd/tutorials/generated/
├── src/
│   ├── App.jsx                 (React Router setup)
│   ├── App.css                 (Main styles)
│   ├── main.jsx                (Entry point)
│   ├── index.css               (Global styles)
│   ├── pages/
│   │   ├── Listing.jsx         (Tutorial listing page)
│   │   └── TutorialWrapper.jsx  (Route wrapper)
│   ├── tutorials/
│   │   ├── MatrixDiscovery.jsx      (Component)
│   │   ├── MatrixFromVectors.jsx    (Component)
│   │   └── [new tutorials...]
│   ├── components/
│   │   └── SharedUI.jsx        (Reusable UI library)
│   └── styles/
│       ├── base.css
│       ├── MatrixDiscovery.css
│       └── MatrixFromVectors.css
├── matrix-discovery/           (Original source code preserved)
├── matrix-from-vectors/        (Original source code preserved)
├── node_modules/               (Shared deps via pnpm)
├── package.json                (Root config)
├── pnpm-workspace.yaml         (Workspace declaration)
├── pnpm-lock.yaml              (Lock file)
├── vite.config.js              (Vite config - single server)
└── index.html                  (Entry point)
```

## Shared UI Library

A reusable component library is available in `src/components/SharedUI.jsx`:

```jsx
import {
  Button,
  Card,
  CodeBlock,
  Container,
  Header
} from '../components/SharedUI.jsx'
```

### Components

- **Button** - Primary, secondary, danger variants with full styling
- **Card** - Container for content with shadows and borders
- **CodeBlock** - Syntax-highlighted code blocks
- **Container** - Max-width layout container
- **Header** - Title + subtitle component

## Adding a New Tutorial

### 1. Create the Tutorial Component

```jsx
// src/tutorials/MyNewTutorial.jsx
import React from 'react'
import { Container, Header } from '../components/SharedUI.jsx'

export default function MyNewTutorial() {
  return (
    <Container className="py-8">
      <Header 
        title="My Tutorial Title" 
        subtitle="Subtitle here"
      />
      {/* Your tutorial content */}
    </Container>
  )
}
```

### 2. Register in TutorialWrapper

```jsx
// src/pages/TutorialWrapper.jsx
import MyNewTutorial from '../tutorials/MyNewTutorial.jsx'

const tutorialComponents = {
  'matrix-discovery': MatrixDiscovery,
  'matrix-from-vectors': MatrixFromVectors,
  'my-new-tutorial': MyNewTutorial  // ← Add here
}
```

### 3. Add to Listing

```jsx
// src/pages/Listing.jsx
const tutorials = [
  {
    id: 'my-new-tutorial',
    title: 'My New Tutorial',
    description: 'What this teaches',
    tags: ['tag1', 'tag2']
  }
  // ... existing tutorials
]
```

### 4. Done!

That's it. The new tutorial will:
- Be automatically available at `/tutorial/my-new-tutorial`
- Share all root dependencies (no new node_modules needed)
- Appear in the listing with a clickable card
- Have the shared UI library available

## Development

### Start the dev server

```bash
cd ~/clawd/tutorials/generated
pnpm dev
```

Opens at `http://localhost:5184/` (DO NOT USE OTHER PORTS)

### Features

- **Hot Module Reload (HMR)** — Changes reflect instantly
- **Single server** — No juggling multiple ports
- **Shared dependencies** — Fast installs and smaller disk footprint

### Add Dependencies

If a tutorial needs a package:

```bash
cd ~/clawd/tutorials/generated
pnpm add package-name
```

All tutorials can immediately use it.

## Building

### Production Build

```bash
cd ~/clawd/tutorials/generated
pnpm build
```

Outputs optimized bundle to `dist/`. Deploy this folder to any static host.

### Deployment

The `dist/` folder is deployment-ready:
- Single HTML file with all routing handled client-side
- Can be served from any web server or CDN
- No backend required

## pnpm Workspace

The `pnpm-workspace.yaml` declares workspace packages:

```yaml
packages:
  - ./tutorials/*
```

This allows individual tutorials to have their own `package.json` (if needed) while sharing the root node_modules. Currently, tutorials are just React components (no separate package.json), but you can add them if needed:

```
tutorials/
├── matrix-discovery/
│   ├── package.json    (optional; inherits root deps)
│   └── ...
```

## Gotchas & Tips

1. **Old tutorial directories** — `matrix-discovery/` and `matrix-from-vectors/` contain the original source code but are no longer used for running. They're preserved for reference.

2. **Components vs Pages** — Tutorials are React components in `src/tutorials/`, not separate Vite projects.

3. **Styles** — Each tutorial can have its own CSS file in `src/styles/` or use shared components.

4. **No conflicts** — Since all tutorials share one package.json, dependency version conflicts must be resolved at the root level.

## Migration from Old Structure

Previously, each tutorial was:
- A separate Vite project
- Running on a different port (5173, 5174, 5175, etc.)
- With duplicate node_modules

Now:
- Single Vite project
- All tutorials served from one port
- Shared node_modules (massive disk savings)
- Easier to manage and deploy

The original tutorial code (`App.jsx`, components, etc.) has been preserved in the original directories and converted to React components.

## Next Steps

The following can be added as the tutorials grow:

1. **Shared state** — Redux/Zustand if tutorials need to coordinate
2. **Navigation improvements** — Breadcrumbs, related tutorials
3. **Search/filtering** — Find tutorials by tag or topic
4. **Analytics** — Track which tutorials are popular
5. **More shared components** — Build out the UI library as patterns emerge
6. **Tailwind CSS** — If consistent styling becomes important

For now, the architecture is clean, minimal, and ready to scale.
