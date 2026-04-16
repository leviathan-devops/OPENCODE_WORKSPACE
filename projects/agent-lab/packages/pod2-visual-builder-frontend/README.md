# Pod 2: Visual Builder Frontend

## Overview

React/Three.js-based visual agent design interface with 2D/3D "character creation" for agents and real-time preview.

## Core Components

### React Application
- TypeScript + Vite build system
- Zustand for state management
- React Router for navigation

### Three.js Visualization Engine
- 3D scene for agent visualization
- Interactive controls for agent design
- Real-time preview rendering

### Agent Design Interface
- Visual component palette
- Property editors for agent configuration
- Drag-and-drop workflow builder

### Real-time Collaboration
- WebSocket connections to backend
- Multi-user editing support
- Live preview updates

## Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **3D Engine**: Three.js + @react-three/fiber
- **State Management**: Zustand
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Styled Components
- **Real-time**: Socket.io client

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build
bun run build

# Test
bun run test
```