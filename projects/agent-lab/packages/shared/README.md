# Shared Utilities and Types

## Overview

Common utilities, TypeScript types, and shared libraries used across all Agent Lab pods.

## Core Components

### Type Definitions
- Agent specification interfaces
- API contract types
- Event and message schemas

### Utility Functions
- Logging utilities with structured output
- Error handling and validation
- Configuration loading and parsing

### Shared Constants
- Environment variable names
- API endpoints and routes
- Feature flags and configuration defaults

### Common Libraries
- API client implementations
- Authentication helpers
- Serialization/deserialization utilities

## Usage

```typescript
// Import shared types
import type { AgentSpec, BuildConfig } from '@agent-lab/shared';

// Import utilities
import { logger, validateAgentSpec } from '@agent-lab/shared';

// Use constants
import { API_ENDPOINTS, FEATURE_FLAGS } from '@agent-lab/shared';
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck
```

This package is a dependency of all other pods and should be built first when setting up the development environment.