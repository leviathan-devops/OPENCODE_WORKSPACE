#!/bin/bash
#===============================================================================
# Initialize Test Project
# Creates the synthetic physiolab test project since GitHub clone is unavailable
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/tmp/hermes-test-project"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Initializing Physiolab Test Project                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create directory structure
mkdir -p "$PROJECT_DIR"/{src/{api,core,utils,web/components},tests,docs,config}

echo "Created directory structure"

# README.md
cat > "$PROJECT_DIR/README.md" << 'EOF'
# Physiolab - Physiological Data Processing Platform

## Overview
Physiolab is a multi-module system for processing physiological data from various medical devices.

## Architecture
- **api/** - REST API layer (TypeScript/Node.js)
- **core/** - Core processing engine (Python)
- **utils/** - Shared utilities
- **web/** - Web interface (TypeScript/React)

## Requirements
- Node.js >= 18.0
- Python >= 3.9
- PostgreSQL >= 14

## Quick Start
```bash
npm install
pip install -r requirements.txt
npm test
npm run dev
```
EOF
echo "Created README.md"

# TODO.md
cat > "$PROJECT_DIR/TODO.md" << 'EOF'
# TODO - Incomplete Features

## High Priority
- [ ] Implement WebSocket support for real-time data streaming
- [ ] Add authentication middleware to API routes
- [ ] Complete the signal filtering algorithm in core/processor.py
- [ ] Add database connection pooling

## Medium Priority
- [ ] Write unit tests for utils/validators.py
- [ ] Implement cache invalidation in web/components
- [ ] Add logging to API error handlers
- [ ] Create OpenAPI documentation

## Low Priority
- [ ] Add TypeScript types for all API responses
- [ ] Implement retry logic for failed API calls
- [ ] Add health check endpoint
- [ ] Create deployment Docker Compose file
EOF
echo "Created TODO.md"

# KNOWN_BUGS.md
cat > "$PROJECT_DIR/KNOWN_BUGS.md" << 'EOF'
# Known Bugs

## Critical
- **BUG-001**: Memory leak in core/processor.py line 142
- **BUG-002**: Race condition in api/routes.ts

## High
- **BUG-003**: SQL injection vulnerability in utils/db.py
- **BUG-004**: TypeScript error in web/components/Dashboard.tsx

## Medium
- **BUG-005**: Performance issue in core/signal_filter.py
- **BUG-006**: API returns 200 instead of 404

## Low
- **BUG-007**: Typo in error message
- **BUG-008**: Missing await in async function
EOF
echo "Created KNOWN_BUGS.md"

# package.json
cat > "$PROJECT_DIR/package.json" << 'EOF'
{
  "name": "physiolab",
  "version": "0.1.0",
  "description": "Physiological Data Processing Platform",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/api/server.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^18.15.0",
    "@types/react": "^18.0.28",
    "jest": "^29.5.0",
    "typescript": "^5.0.0"
  }
}
EOF
echo "Created package.json"

# requirements.txt
cat > "$PROJECT_DIR/requirements.txt" << 'EOF'
numpy>=1.21.0
psycopg2-binary>=2.9.3
pytest>=7.0.0
EOF
echo "Created requirements.txt"

# docs/ARCHITECTURE.md
cat > "$PROJECT_DIR/docs/ARCHITECTURE.md" << 'EOF'
# Architecture Documentation

## System Overview
Physiolab is designed as a modular physiological data processing platform.

## Component Architecture
```
                    ┌─────────────┐
                    │   Web UI    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  REST API   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
  │   Core      │  │   Utils     │  │  Database   │
  │ Processing  │  │             │  │             │
  │  (Python)   │  │             │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘
```
EOF
echo "Created docs/ARCHITECTURE.md"

# src/api/routes.ts
cat > "$PROJECT_DIR/src/api/routes.ts" << 'EOF'
import express, { Request, Response } from 'express';

const router = express.Router();

// BUG-002: Race condition
const sessionCache = new Map();

// TODO: Add authentication middleware
router.post('/api/data/ingest', async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    sessionCache.set(req.headers['session-id'], rawData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BUG-003: SQL injection
router.get('/api/data/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const query = `SELECT * FROM data WHERE id = '${id}'`;
  res.json({ query });
});

// BUG-006: Returns 200 for non-existent
router.get('/api/resource/:id', (req: Request, res: Response) => {
  res.json({ found: false });
});

export default router;
EOF
echo "Created src/api/routes.ts"

# src/core/processor.py
cat > "$PROJECT_DIR/src/core/processor.py" << 'EOF'
"""Core physiological data processing module."""
import numpy as np
from typing import Dict, Any

_processing_cache = []

class DataProcessor:
    def __init__(self):
        self.cache_enabled = True
        
    def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        samples = raw_data.get('samples', [])
        # BUG-001: Memory leak
        sample_array = np.array(samples)
        _processing_cache.append(sample_array)
        return {'processed': samples, 'count': len(samples)}

class SignalFilter:
    def filter_signal(self, signal: np.ndarray) -> np.ndarray:
        # BUG-005: O(n²) algorithm
        n = len(signal)
        result = np.zeros(n)
        for i in range(n):
            for j in range(max(0, i-10), i):
                result[i] += signal[j] * np.exp(-(i-j)**2)
        return result
EOF
echo "Created src/core/processor.py"

# src/utils/validators.ts
cat > "$PROJECT_DIR/src/utils/validators.ts" << 'EOF'
// TODO: Write unit tests for this module

export function validateInput(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (data === null || data === undefined) {
    errors.push('Input cannot be null');
  }
  return { valid: errors.length === 0, errors };
}

export function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[;'"]/g, '');
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
EOF
echo "Created src/utils/validators.ts"

# src/utils/db.py
cat > "$PROJECT_DIR/src/utils/db.py" << 'EOF'
"""Database utilities."""
import psycopg2
from typing import List, Dict, Any

_connection = None

def get_connection():
    global _connection
    if _connection is None:
        _connection = psycopg2.connect('postgresql://localhost/physiolab')
    return _connection

# BUG-003: SQL injection vulnerability
def queryDatabase(query: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query)  # Direct string interpolation!
    return []
EOF
echo "Created src/utils/db.py"

# src/web/components/Dashboard.tsx
cat > "$PROJECT_DIR/src/web/components/Dashboard.tsx" << 'EOF'
import React, { useState, useEffect } from 'react';

interface DashboardProps {
  dataUrl: string;
}

// BUG-004: Missing null check
export function Dashboard({ dataUrl }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(dataUrl)
      .then(res => res.json())
      .then(result => {
        setData(result.data);  // Crashes if result.data is null
      });
  }, [dataUrl]);

  return <div>Dashboard with {data.length} items</div>;
}
EOF
echo "Created src/web/components/Dashboard.tsx"

# src/api/handlers.ts
cat > "$PROJECT_DIR/src/api/handlers.ts" << 'EOF'
import { Request, Response } from 'express';

// BUG-008: Missing await
export async function handleDataCreate(req: Request, res: Response) {
  const record = req.body;
  processRecordAsync(record);  // Missing await!
  res.status(201).json({ success: true });
}

async function processRecordAsync(record: any): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

// BUG-007: Typo in error message
export function handleProcessingError(error: Error): string {
  return 'Unabel to process: ' + error.message;  // "Unabel" typo
}
EOF
echo "Created src/api/handlers.ts"

# tests/test_processor.py
cat > "$PROJECT_DIR/tests/test_processor.py" << 'EOF'
"""Tests for the core data processor."""
import pytest
from src.core.processor import DataProcessor, SignalFilter

class TestDataProcessor:
    def setup_method(self):
        self.processor = DataProcessor()
    
    def test_process_empty_data(self):
        result = self.processor.process({})
        assert 'processed' in result
    
    def test_process_with_samples(self):
        result = self.processor.process({'samples': [1.0, 2.0, 3.0]})
        assert result['count'] == 3

class TestSignalFilter:
    def test_filter_creation(self):
        filter_obj = SignalFilter()
        assert filter_obj is not None
EOF
echo "Created tests/test_processor.py"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Test project initialized successfully!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Location: $PROJECT_DIR"
echo "Files created: $(find $PROJECT_DIR -type f | wc -l)"
echo ""
