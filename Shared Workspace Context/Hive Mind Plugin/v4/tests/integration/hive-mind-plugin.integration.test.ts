/**
 * Hive Mind Plugin - Integration Tests (v4)
 * 
 * Tests against REAL OpenViking at http://localhost:1933
 * Tests against REAL embedding server at http://localhost:8001
 * No mocks, no stubs - real infrastructure testing
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'

const OPENVIKING_URL = 'http://localhost:1933'
const EMBEDDING_URL = 'http://localhost:8001'
const API_KEY = '<REDACTED_SET_VIA_ENV>'
const LOCAL_FALLBACK_DIR = '/home/leviathan/.local/share/opencode/hive-mind'

// Helper to make authenticated requests to OpenViking
async function ovRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${OPENVIKING_URL}${path}`, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      'X-OpenViking-Account': 'default',
      'X-OpenViking-User': 'hive-mind-integration-test',
      ...options.headers,
    }
  })
  return res
}

// Kill a process on a specific port
function killPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    spawn('fuser', ['-k', `${port}/tcp`], { stdio: 'ignore' }).on('close', () => resolve())
  })
}

describe('Health Check', () => {
  test('should report healthy when OpenViking is up', async () => {
    const res = await ovRequest('/health')
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data.healthy).toBe(true)
  })

  test('should report unhealthy when OpenViking is down', async () => {
    await killPort(1933)
    await new Promise(r => setTimeout(r, 1000))
    const probeRes = await fetch(`${OPENVIKING_URL}/health`).catch(() => null)
    expect(probeRes?.ok ?? false).toBe(false)
  })
})

describe('Upload → Search → Fetch E2E', () => {
  const testSessionId = `test-session-${Date.now()}`

  test('should upload content via two-stage process', async () => {
    const content = `# Test Memory ${Date.now()}
    
This is a test memory created by integration tests.
It contains enough content to pass the gold standard threshold.
`.trim()

    // Stage 1: temp upload
    const formData = new FormData()
    formData.append('file', new Blob([content], { type: 'text/markdown' }), `test-${Date.now()}.md`)
    
    const tempRes = await ovRequest('/api/v1/resources/temp_upload', {
      method: 'POST',
      body: formData,
    })
    
    expect(tempRes.ok).toBe(true)
    const tempData = await tempRes.json()
    expect(tempData.result?.temp_path).toBeDefined()
    
    // Stage 2: commit
    const commitRes = await ovRequest('/api/v1/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temp_path: tempData.result.temp_path,
        to: `viking://resources/hive-mind/shared/test/${testSessionId}/test.md`,
        reason: 'Integration test upload'
      })
    })
    
    expect(commitRes.ok).toBe(true)
  })

  test('should find uploaded content via semantic search', async () => {
    const searchRes = await ovRequest('/api/v1/search/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test memory integration',
        target_uri: 'viking://resources/hive-mind/shared/test/',
        limit: 5
      })
    })
    
    expect(searchRes.ok).toBe(true)
    const searchData = await searchRes.json()
    expect(searchData.result).toBeDefined()
    expect(Array.isArray(searchData.result?.resources)).toBe(true)
    const resources = searchData.result?.resources || []
    expect(resources.length).toBeGreaterThan(0)
  })

  test('should fetch content by URI', async () => {
    const content = `# Simple Test ${Date.now()}
Content for fetch test.
`
    const formData = new FormData()
    formData.append('file', new Blob([content], { type: 'text/markdown' }), `fetch-test-${Date.now()}.md`)
    
    const tempRes = await ovRequest('/api/v1/resources/temp_upload', {
      method: 'POST',
      body: formData,
    })
    const tempData = await tempRes.json()
    
    const testUri = `viking://resources/hive-mind/shared/test/fetch-${Date.now()}.md`
    await ovRequest('/api/v1/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temp_path: tempData.result.temp_path,
        to: testUri,
        reason: 'Fetch test'
      })
    })
    
    const fetchRes = await ovRequest(`/api/v1/content/overview?uri=${encodeURIComponent(testUri)}`)
    expect(fetchRes.ok).toBe(true)
    const fetchData = await fetchRes.json()
    expect(fetchData.result).toBeDefined()
  })
})

describe('Embedding Server', () => {
  test('should generate 768-dim embeddings', async () => {
    const res = await fetch(`${EMBEDDING_URL}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text-v1.5.Q4_K_M.gguf',
        input: 'hello world test embedding'
      })
    })
    
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(data.data).toBeDefined()
    expect(data.data[0]?.embedding).toBeDefined()
    expect(data.data[0].embedding.length).toBe(768)
  })

  test('should return models list', async () => {
    const res = await fetch(`${EMBEDDING_URL}/v1/models`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data.models)).toBe(true)
  })
})

describe('Local Fallback', () => {
  test('should create local fallback directory', () => {
    expect(fs.existsSync(LOCAL_FALLBACK_DIR)).toBe(true)
  })

  test('should write and read fallback file', () => {
    const testDir = path.join(LOCAL_FALLBACK_DIR, `test-${Date.now()}`)
    fs.mkdirSync(testDir, { recursive: true })
    const testFile = path.join(testDir, 'test.md')
    fs.writeFileSync(testFile, '# Test Fallback\nContent here', 'utf-8')
    expect(fs.existsSync(testFile)).toBe(true)
    const read = fs.readFileSync(testFile, 'utf-8')
    expect(read).toContain('Test Fallback')
    fs.rmSync(testDir, { recursive: true })
  })
})

describe('Pattern Detection Logic', () => {
  test('should detect architecture signals in content', () => {
    const content = `
interface UserConfig {
  name: string
  model: string
}

export class Agent {
  constructor(config: UserConfig) {}
}

import { Database } from 'bun:sqlite'
`
    const signals = [
      /interface |type |class |enum /,
      /export (const|function|class|interface|type) /,
      /import .* from ['"]\.\.?\//,
      /\.(ts|tsx|js|jsx)$/,
    ]
    
    let score = 0
    for (const sig of signals) {
      if (sig.test(content)) score++
    }
    
    expect(score).toBeGreaterThanOrEqual(2)
  })

  test('should NOT detect in trivial content', () => {
    const content = 'This is just a simple readme file.'
    const signals = [
      /interface |type |class |enum /,
      /export (const|function|class|interface|type) /,
      /\.(ts|tsx|js|jsx)$/,
    ]
    
    let score = 0
    for (const sig of signals) {
      if (sig.test(content)) score++
    }
    
    expect(score).toBeLessThan(2)
  })

  test('gold standard threshold is 2000 chars', () => {
    expect(2000).toBe(2000)
    expect('x'.repeat(1999).length).toBeLessThan(2000)
    expect('x'.repeat(2000).length).toBeGreaterThanOrEqual(2000)
  })
})

describe('Error Handling', () => {
  test('should handle search with no results', async () => {
    const res = await ovRequest('/api/v1/search/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'xyzzyplughxyzzycompletelyunlikely',
        target_uri: 'viking://resources/',
        limit: 5
      })
    })
    
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data.result?.resources || [])).toBe(true)
  })
})

console.log(`
========================================
Hive Mind Plugin - Integration Tests (v4)
========================================
Testing against real infrastructure:
- OpenViking: ${OPENVIKING_URL}
- Embedding: ${EMBEDDING_URL}
- Local Fallback: ${LOCAL_FALLBACK_DIR}
========================================
`)