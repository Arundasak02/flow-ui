# Flow UI

**The bridge between business and code.**

Flow UI is the web-based visualization layer for the Flow platform. It renders architecture graphs with business meaning at every node, trace replay with packet animation, and serves both Product Owners and Engineers as first-class users through dual-lens views on the same data.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Visual QA (Playwright)

Run visual and interaction checks:

```bash
npm run test:e2e
```

Run headed:

```bash
npm run test:e2e:headed
```

Run loop (automatic repeated visual inspection):

```bash
npm run test:e2e:loop
```

Install browser once (if needed):

```bash
npm run test:e2e:install
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI framework |
| Vite 6 | Build tool |
| React Flow (@xyflow/react) | Graph rendering, zoom, pan |
| Tailwind CSS 4 | Design tokens + styling |
| Zustand | UI state management |
| TanStack Query | Server state (API) |
| Framer Motion | Animations |
| Lucide React | Icons |
| Manrope + JetBrains Mono | Typography |

## Project Structure

```
src/
├── components/
│   ├── graph/        # FlowNode, FlowEdge (the graph elements)
│   ├── layout/       # SearchBar, ViewToggle, BottomBar, FlowLogo
│   ├── panels/       # NodeDetailPanel
│   └── shared/       # Reusable UI components
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── hooks/            # Custom React hooks
├── lib/              # Utilities, sample data, API client
└── assets/           # Static assets
```

## Design Principles

1. **The graph is the hero** — fills the viewport, everything else floats over it
2. **Business + Engineering are equal** — same graph, different lens via tab toggle
3. **Progressive disclosure** — zoom reveals more detail, click for documentation
4. **Alive, not static** — trace replay, activity indicators, packet animation
5. **Search-first navigation** — Cmd+K to find anything, canvas flies to it

## Connecting to Flow Core Service

The Vite dev server proxies `/api/*` to `http://localhost:8080`. Start FCS on port 8080 and the UI will connect automatically.
