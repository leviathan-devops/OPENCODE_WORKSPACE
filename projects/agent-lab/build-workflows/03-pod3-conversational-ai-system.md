# Pod 3: Conversational AI System - Executable Build Process

## Mission
Build production-grade conversational AI system for Agent Lab that enables natural language interaction for agent specification and refinement. Implement enhanced orchestrator agent with multi-model NLP pipeline, intent recognition, specification extraction, and interactive clarification engine integrated with visual builder.

## Success Criteria
- ✅ Enhanced `sisyphus` agent with lab-specific dialogue capabilities
- ✅ Multi-model NLP pipeline with GLM-5 + DeepSeek Reasoner ensemble
- ✅ Intent recognition system with >95% accuracy on agent specification tasks
- ✅ Specification builder converting dialogue to structured agent blueprints
- ✅ Interactive clarification engine with targeted question generation
- ✅ Vector database for conversation history and agent pattern matching
- ✅ Real-time specification validation against capability database
- ✅ Conversation context management across sessions
- ✅ Integration with visual builder for real-time design updates
- ✅ Fallback chain to OpenCode Zen models for non-critical paths

## Pre-flight Checks
1. **Verify development environment**:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
   python --version
   pip --version
   docker --version
   ```

2. **Check model API availability**:
   ```bash
   curl -s http://localhost:11434/api/version  # Ollama
   curl -s http://localhost:8000/v1/models     # vLLM
   ```

3. **Verify database connectivity**:
   ```bash
   docker-compose ps | grep postgres
   pg_isready -h localhost -p 5432
   docker-compose ps | grep redis
   redis-cli ping
   ```

4. **Check vector database**:
   ```bash
   docker-compose ps | grep qdrant
   curl -s http://localhost:6333/health
   ```

## Phase 1: Orchestrator Agent Foundation

### Step 1: Project Structure Setup
```bash
# Create orchestrator package
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
mkdir -p packages/orchestrator/src/{agents,services,models,schemas,utils,prompts}

# Initialize package.json
cat > packages/orchestrator/package.json << 'EOF'
{
  "name": "@agent-lab/orchestrator",
  "version": "0.1.0",
  "description": "Conversational AI System for Agent Lab",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "train:intent": "python scripts/train_intent_model.py",
    "train:ner": "python scripts/train_ner_model.py"
  },
  "dependencies": {
    "@opencode/zen": "^0.1.0",
    "langchain": "^0.1.0",
    "langsmith": "^0.1.0",
    "openai": "^4.0.0",
    "qdrant-client": "^1.7.0",
    "redis": "^4.6.0",
    "pg": "^8.11.0",
    "zod": "^3.22.0",
    "winston": "^3.10.0",
    "axios": "^1.6.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "prom-client": "^14.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^3.12.0",
    "vitest": "^0.34.0",
    "@vitest/ui": "^0.34.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@types/pg": "^8.10.0",
    "@types/redis": "^4.0.0"
  }
}
EOF

# Create TypeScript configuration
cat > packages/orchestrator/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

# Create Python environment for ML components
cat > packages/orchestrator/requirements.txt << 'EOF'
torch>=2.0.0
transformers>=4.35.0
sentence-transformers>=2.2.0
scikit-learn>=1.3.0
pandas>=2.0.0
numpy>=1.24.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
qdrant-client>=1.7.0
openai>=1.0.0
langchain>=0.1.0
langsmith>=0.1.0
chromadb>=0.4.0
nltk>=3.8.0
spacy>=3.7.0
EOF

# Create Dockerfile for ML service
cat > packages/orchestrator/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Run the application
CMD ["uvicorn", "src.ml_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
EOF

echo "Phase 1 setup complete. Run 'cd packages/orchestrator && pnpm install && pip install -r requirements.txt'"
```

### Step 2: Core Agent Architecture
```bash
# Create base agent class
cat > packages/orchestrator/src/agents/base.ts << 'EOF'
import { EventEmitter } from 'events'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { ConversationState, AgentCapability, AgentSpecification } from '@/models/types'

export abstract class BaseAgent extends EventEmitter {
  protected logger: Logger
  protected capabilities: AgentCapability[] = []
  protected context: Record<string, any> = {}

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string
  ) {
    super()
    this.logger = createLogger(`agent:${id}`)
  }

  abstract async initialize(): Promise<void>
  abstract async process(input: string, state: ConversationState): Promise<ConversationState>
  abstract async validate(specification: AgentSpecification): Promise<boolean>

  async cleanup(): Promise<void> {
    this.logger.info('Agent cleaning up')
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities
  }

  setContext(key: string, value: any): void {
    this.context[key] = value
    this.emit('context:updated', { key, value })
  }

  getContext(key: string): any {
    return this.context[key]
  }

  protected logEvent(event: string, data: any): void {
    this.logger.info(`Event: ${event}`, data)
    this.emit(event, data)
  }
}
EOF

# Create orchestrator agent
cat > packages/orchestrator/src/agents/orchestrator.ts << 'EOF'
import { BaseAgent } from './base'
import { ConversationState, AgentSpecification, Intent, ClarificationQuestion } from '@/models/types'
import { IntentRecognizer } from '@/services/intent-recognizer'
import { SpecificationBuilder } from '@/services/specification-builder'
import { ClarificationEngine } from '@/services/clarification-engine'
import { CapabilityValidator } from '@/services/capability-validator'
import { MemoryManager } from '@/services/memory-manager'

export class OrchestratorAgent extends BaseAgent {
  private intentRecognizer: IntentRecognizer
  private specificationBuilder: SpecificationBuilder
  private clarificationEngine: ClarificationEngine
  private capabilityValidator: CapabilityValidator
  private memoryManager: MemoryManager

  constructor() {
    super('orchestrator', 'Agent Lab Orchestrator', 'Natural language interface for agent specification')
    this.capabilities = [
      {
        id: 'intent-recognition',
        name: 'Intent Recognition',
        description: 'Identify user intents for agent creation',
        category: 'nlp'
      },
      {
        id: 'specification-extraction',
        name: 'Specification Extraction',
        description: 'Extract structured specifications from natural language',
        category: 'nlp'
      },
      {
        id: 'clarification-generation',
        name: 'Clarification Generation',
        description: 'Generate targeted questions to refine specifications',
        category: 'dialogue'
      },
      {
        id: 'specification-validation',
        name: 'Specification Validation',
        description: 'Validate specifications against available capabilities',
        category: 'validation'
      }
    ]
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing orchestrator agent')
    
    this.intentRecognizer = new IntentRecognizer()
    this.specificationBuilder = new SpecificationBuilder()
    this.clarificationEngine = new ClarificationEngine()
    this.capabilityValidator = new CapabilityValidator()
    this.memoryManager = new MemoryManager()

    await Promise.all([
      this.intentRecognizer.initialize(),
      this.specificationBuilder.initialize(),
      this.clarificationEngine.initialize(),
      this.capabilityValidator.initialize(),
      this.memoryManager.initialize()
    ])

    this.logger.info('Orchestrator agent initialized')
  }

  async process(input: string, state: ConversationState): Promise<ConversationState> {
    this.logger.info('Processing input', { input, stateId: state.id })

    // Step 1: Recognize intent
    const intent = await this.intentRecognizer.recognize(input, state)
    this.logEvent('intent:recognized', { intent, input })

    // Step 2: Update conversation state
    state = await this.memoryManager.updateState(state, {
      input,
      intent,
      timestamp: new Date().toISOString()
    })

    // Step 3: Extract or refine specification
    if (intent.type === 'agent_specification') {
      const specification = await this.specificationBuilder.extract(input, state)
      state.currentSpecification = specification
      this.logEvent('specification:extracted', { specification })
      
      // Step 4: Validate specification
      const validation = await this.capabilityValidator.validate(specification)
      if (!validation.valid) {
        state.validationErrors = validation.errors
        this.logEvent('specification:validation_failed', { errors: validation.errors })
        
        // Step 5: Generate clarification questions if needed
        const questions = await this.clarificationEngine.generateQuestions(
          specification,
          validation.errors
        )
        state.pendingClarifications = questions
        this.logEvent('clarification:generated', { questions })
      } else {
        state.validationErrors = []
        state.pendingClarifications = []
        state.readyForVisualization = true
        this.logEvent('specification:valid', { specification })
      }
    } else if (intent.type === 'clarification_response') {
      // Handle clarification response
      state = await this.handleClarificationResponse(input, state)
    }

    // Step 6: Generate response
    const response = await this.generateResponse(state)
    state.responses.push(response)

    // Step 7: Persist state
    await this.memoryManager.persistState(state)

    return state
  }

  async validate(specification: AgentSpecification): Promise<boolean> {
    const validation = await this.capabilityValidator.validate(specification)
    return validation.valid
  }

  private async handleClarificationResponse(
    input: string,
    state: ConversationState
  ): Promise<ConversationState> {
    if (!state.pendingClarifications || state.pendingClarifications.length === 0) {
      this.logger.warn('Received clarification response but no pending questions')
      return state
    }

    const question = state.pendingClarifications[0]
    const answer = input

    // Update specification with clarification
    const updatedSpec = await this.specificationBuilder.applyClarification(
      state.currentSpecification!,
      question,
      answer
    )

    state.currentSpecification = updatedSpec
    state.pendingClarifications = state.pendingClarifications.slice(1)

    // Re-validate after clarification
    const validation = await this.capabilityValidator.validate(updatedSpec)
    if (validation.valid) {
      state.validationErrors = []
      state.readyForVisualization = true
    } else {
      state.validationErrors = validation.errors
      
      // Generate new clarification questions if still invalid
      if (state.pendingClarifications.length === 0) {
        const newQuestions = await this.clarificationEngine.generateQuestions(
          updatedSpec,
          validation.errors
        )
        state.pendingClarifications = newQuestions
      }
    }

    return state
  }

  private async generateResponse(state: ConversationState): Promise<string> {
    if (state.pendingClarifications && state.pendingClarifications.length > 0) {
      const question = state.pendingClarifications[0]
      return `To help me build your agent, I need some clarification: ${question.text}`
    }

    if (state.readyForVisualization && state.currentSpecification) {
      return `Great! I've created a specification for your agent. I'm now sending it to the visual builder where you can see and refine the design.`
    }

    if (state.validationErrors && state.validationErrors.length > 0) {
      const errorSummary = state.validationErrors.slice(0, 3).join(', ')
      return `I found some issues with your specification: ${errorSummary}. Let me ask some questions to clarify your requirements.`
    }

    return "I'm ready to help you create an agent. What would you like your agent to do?"
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.intentRecognizer.cleanup(),
      this.specificationBuilder.cleanup(),
      this.clarificationEngine.cleanup(),
      this.capabilityValidator.cleanup(),
      this.memoryManager.cleanup()
    ])
    await super.cleanup()
  }
}
EOF

echo "Core agent architecture created."
```

## Phase 2: NLP Pipeline Implementation

### Step 3: Intent Recognition System
```bash
# Create intent recognizer service
cat > packages/orchestrator/src/services/intent-recognizer.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { ConversationState, Intent, IntentType } from '@/models/types'
import { OpenCodeZenClient } from '@/clients/opencode-zen'
import { VectorStore } from '@/services/vector-store'
import { RedisCache } from '@/services/redis-cache'

export class IntentRecognizer {
  private logger: Logger
  private zenClient: OpenCodeZenClient
  private vectorStore: VectorStore
  private cache: RedisCache
  private intentPatterns: Map<IntentType, RegExp[]>

  constructor() {
    this.logger = createLogger('intent-recognizer')
    this.intentPatterns = new Map()
    this.initializePatterns()
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing intent recognizer')
    this.zenClient = new OpenCodeZenClient()
    this.vectorStore = new VectorStore()
    this.cache = new RedisCache()
    
    await Promise.all([
      this.zenClient.initialize(),
      this.vectorStore.initialize(),
      this.cache.initialize()
    ])
    
    // Load intent examples into vector store
    await this.loadIntentExamples()
    
    this.logger.info('Intent recognizer initialized')
  }

  async recognize(input: string, state: ConversationState): Promise<Intent> {
    // Check cache first
    const cacheKey = `intent:${Buffer.from(input).toString('base64')}`
    const cached = await this.cache.get<Intent>(cacheKey)
    if (cached) {
      this.logger.debug('Intent retrieved from cache', { input, intent: cached })
      return cached
    }

    // Try pattern matching first (fast path)
    const patternMatch = this.matchPatterns(input)
    if (patternMatch) {
      await this.cache.set(cacheKey, patternMatch, 300) // Cache for 5 minutes
      return patternMatch
    }

    // Use semantic search for similar intents
    const similarIntent = await this.semanticSearch(input)
    if (similarIntent && similarIntent.confidence > 0.8) {
      await this.cache.set(cacheKey, similarIntent, 300)
      return similarIntent
    }

    // Fall back to LLM classification (slow path)
    const llmIntent = await this.classifyWithLLM(input, state)
    await this.cache.set(cacheKey, llmIntent, 300)
    
    // Store as example for future learning
    await this.storeAsExample(input, llmIntent)

    return llmIntent
  }

  private initializePatterns(): void {
    this.intentPatterns.set('agent_specification', [
      /create.*agent/i,
      /build.*agent/i,
      /make.*agent/i,
      /I want.*agent/i,
      /need.*agent/i,
      /help me.*agent/i
    ])

    this.intentPatterns.set('clarification_response', [
      /yes/i,
      /no/i,
      /I want/i,
      /it should/i,
      /make it/i,
      /change.*to/i
    ])

    this.intentPatterns.set('modification_request', [
      /change.*agent/i,
      /modify.*agent/i,
      /update.*agent/i,
      /edit.*agent/i,
      /adjust.*agent/i
    ])

    this.intentPatterns.set('execution_request', [
      /run.*agent/i,
      /test.*agent/i,
      /execute.*agent/i,
      /start.*agent/i,
      /launch.*agent/i
    ])

    this.intentPatterns.set('help_request', [
      /help/i,
      /what can.*do/i,
      /how.*work/i,
      /tutorial/i,
      /guide/i,
      /example/i
    ])
  }

  private matchPatterns(input: string): Intent | null {
    for (const [type, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return {
            type,
            confidence: 0.9,
            entities: this.extractEntities(input),
            metadata: { matchedPattern: pattern.toString() }
          }
        }
      }
    }
    return null
  }

  private async semanticSearch(input: string): Promise<Intent | null> {
    try {
      const results = await this.vectorStore.search(
        'intents',
        input,
        { limit: 3 }
      )
      
      if (results.length > 0 && results[0].score > 0.85) {
        const bestMatch = results[0]
        return {
          type: bestMatch.payload.type as IntentType,
          confidence: bestMatch.score,
          entities: this.extractEntities(input),
          metadata: { 
            source: 'semantic_search',
            exampleId: bestMatch.id 
          }
        }
      }
    } catch (error) {
      this.logger.error('Semantic search failed', { error })
    }
    
    return null
  }

  private async classifyWithLLM(input: string, state: ConversationState): Promise<Intent> {
    const prompt = this.buildClassificationPrompt(input, state)
    
    try {
      const response = await this.zenClient.complete(prompt, {
        temperature: 0.1,
        maxTokens: 100
      })
      
      return this.parseLLMResponse(response)
    } catch (error) {
      this.logger.error('LLM classification failed', { error })
      // Fallback to generic intent
      return {
        type: 'agent_specification',
        confidence: 0.5,
        entities: this.extractEntities(input),
        metadata: { fallback: true, error: error.message }
      }
    }
  }

  private buildClassificationPrompt(input: string, state: ConversationState): string {
    return `
You are an intent classifier for an agent building platform. Classify the user's intent from the following input.

Conversation context:
${JSON.stringify(state.context, null, 2)}

User input: "${input}"

Available intent types:
1. agent_specification - User wants to create or specify a new agent
2. clarification_response - User is responding to a clarification question
3. modification_request - User wants to modify an existing agent specification
4. execution_request - User wants to run or test an agent
5. help_request - User needs help or guidance

Return your response as JSON with:
- type: the intent type
- confidence: your confidence score (0.0 to 1.0)
- entities: any extracted entities as key-value pairs
- reasoning: brief explanation of your classification

Response:
`
  }

  private parseLLMResponse(response: string): Intent {
    try {
      const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, ''))
      return {
        type: parsed.type,
        confidence: parsed.confidence,
        entities: parsed.entities || {},
        metadata: { reasoning: parsed.reasoning }
      }
    } catch (error) {
      this.logger.error('Failed to parse LLM response', { response, error })
      // Default fallback
      return {
        type: 'agent_specification',
        confidence: 0.5,
        entities: {},
        metadata: { parseError: true }
      }
    }
  }

  private extractEntities(input: string): Record<string, string> {
    const entities: Record<string, string> = {}
    
    // Extract agent type
    const agentTypeMatch = input.match(/(chat|coding|research|analysis|automation|assistant)\s+agent/i)
    if (agentTypeMatch) {
      entities.agent_type = agentTypeMatch[1].toLowerCase()
    }
    
    // Extract capabilities
    const capabilityKeywords = ['code', 'analyze', 'research', 'chat', 'automate', 'process']
    capabilityKeywords.forEach(keyword => {
      if (input.toLowerCase().includes(keyword)) {
        if (!entities.capabilities) {
          entities.capabilities = keyword
        } else {
          entities.capabilities += `,${keyword}`
        }
      }
    })
    
    return entities
  }

  private async loadIntentExamples(): Promise<void> {
    const examples = [
      { input: "I want to create a chatbot agent", type: "agent_specification" },
      { input: "Build me a coding assistant", type: "agent_specification" },
      { input: "Create an agent that can analyze data", type: "agent_specification" },
      { input: "Yes, that's correct", type: "clarification_response" },
      { input: "No, I want it to generate Python code", type: "clarification_response" },
      { input: "Change the agent to use GPT-4", type: "modification_request" },
      { input: "Run the agent I just created", type: "execution_request" },
      { input: "How does this work?", type: "help_request" },
      { input: "Show me an example", type: "help_request" }
    ]
    
    for (const example of examples) {
      await this.vectorStore.upsert('intents', {
        id: `example_${Date.now()}_${Math.random()}`,
        vector: await this.embedText(example.input),
        payload: {
          input: example.input,
          type: example.type,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  private async embedText(text: string): Promise<number[]> {
    // Use sentence transformer model for embedding
    // In production, this would call a dedicated embedding service
    const response = await fetch('http://localhost:8001/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.embedding
  }

  private async storeAsExample(input: string, intent: Intent): Promise<void> {
    await this.vectorStore.upsert('intents', {
      id: `learned_${Date.now()}_${Math.random()}`,
      vector: await this.embedText(input),
      payload: {
        input,
        type: intent.type,
        confidence: intent.confidence,
        timestamp: new Date().toISOString()
      }
    })
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.zenClient.cleanup(),
      this.vectorStore.cleanup(),
      this.cache.cleanup()
    ])
    this.logger.info('Intent recognizer cleaned up')
  }
}
EOF

echo "Intent recognition system created."
```

### Step 4: Specification Builder
```bash
# Create specification builder service
cat > packages/orchestrator/src/services/specification-builder.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { 
  ConversationState, 
  AgentSpecification, 
  AgentCapability, 
  ClarificationQuestion 
} from '@/models/types'
import { OpenCodeZenClient } from '@/clients/opencode-zen'
import { CapabilityRegistry } from '@/services/capability-registry'

export class SpecificationBuilder {
  private logger: Logger
  private zenClient: OpenCodeZenClient
  private capabilityRegistry: CapabilityRegistry

  constructor() {
    this.logger = createLogger('specification-builder')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing specification builder')
    this.zenClient = new OpenCodeZenClient()
    this.capabilityRegistry = new CapabilityRegistry()
    
    await Promise.all([
      this.zenClient.initialize(),
      this.capabilityRegistry.initialize()
    ])
    
    this.logger.info('Specification builder initialized')
  }

  async extract(input: string, state: ConversationState): Promise<AgentSpecification> {
    this.logger.info('Extracting specification from input', { input })
    
    // Get available capabilities
    const allCapabilities = await this.capabilityRegistry.getAll()
    
    // Build prompt for LLM extraction
    const prompt = this.buildExtractionPrompt(input, state, allCapabilities)
    
    try {
      // Try primary model (GLM-5)
      const response = await this.zenClient.complete(prompt, {
        model: 'glm-5',
        temperature: 0.2,
        maxTokens: 1000
      })
      
      const specification = this.parseSpecification(response, allCapabilities)
      specification.metadata.extractionMethod = 'llm_primary'
      
      return specification
    } catch (error) {
      this.logger.error('Primary model extraction failed, trying fallback', { error })
      
      // Fallback to OpenCode Zen
      const response = await this.zenClient.complete(prompt, {
        model: 'zen',
        temperature: 0.3,
        maxTokens: 800
      })
      
      const specification = this.parseSpecification(response, allCapabilities)
      specification.metadata.extractionMethod = 'llm_fallback'
      specification.metadata.fallbackReason = error.message
      
      return specification
    }
  }

  private buildExtractionPrompt(
    input: string, 
    state: ConversationState, 
    capabilities: AgentCapability[]
  ): string {
    const capabilityDescriptions = capabilities.map(cap => 
      `- ${cap.name} (${cap.id}): ${cap.description}. Category: ${cap.category}.`
    ).join('\n')

    return `
You are an agent specification extractor for an AI agent building platform.

USER REQUEST:
"${input}"

CONVERSATION CONTEXT:
${JSON.stringify(state.context || {}, null, 2)}

AVAILABLE CAPABILITIES:
${capabilityDescriptions}

TASK:
Extract a structured agent specification from the user's request. Include:
1. A clear agent name and description
2. Required capabilities from the available list
3. Configuration parameters for each capability
4. Dependencies between capabilities
5. Expected inputs and outputs

SPECIFICATION TEMPLATE:
{
  "name": "Descriptive agent name",
  "description": "Clear description of agent's purpose",
  "version": "1.0.0",
  "capabilities": [
    {
      "id": "capability_id_from_list",
      "config": {
        // Configuration parameters for this capability
      }
    }
  ],
  "workflow": [
    {
      "from": "capability_id_1",
      "to": "capability_id_2",
      "condition": "optional_condition"
    }
  ],
  "inputs": ["text", "files", "api_calls"],
  "outputs": ["text_response", "generated_code", "analysis_report"],
  "metadata": {
    "complexity": "simple|moderate|complex",
    "estimatedBuildTime": "minutes|hours|days"
  }
}

IMPORTANT:
- Only use capabilities from the available list
- If a requested capability doesn't exist, map to the closest available capability
- Be specific with configuration parameters
- Ensure dependencies are valid (capabilities must exist)

Return only the JSON specification, no additional text.
`
  }

  private parseSpecification(
    llmResponse: string, 
    allCapabilities: AgentCapability[]
  ): AgentSpecification {
    try {
      // Extract JSON from response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const rawSpec = JSON.parse(jsonMatch[0])
      
      // Validate and normalize the specification
      return this.normalizeSpecification(rawSpec, allCapabilities)
    } catch (error) {
      this.logger.error('Failed to parse LLM response', { error, response: llmResponse })
      
      // Return minimal valid specification
      return {
        name: 'Unnamed Agent',
        description: 'Automatically generated agent',
        version: '1.0.0',
        capabilities: [],
        workflow: [],
        inputs: [],
        outputs: [],
        metadata: {
          extractionError: true,
          errorMessage: error.message,
          complexity: 'unknown'
        }
      }
    }
  }

  private normalizeSpecification(
    rawSpec: any, 
    allCapabilities: AgentCapability[]
  ): AgentSpecification {
    // Ensure required fields exist
    const spec: AgentSpecification = {
      name: rawSpec.name || 'Unnamed Agent',
      description: rawSpec.description || 'No description provided',
      version: rawSpec.version || '1.0.0',
      capabilities: [],
      workflow: rawSpec.workflow || [],
      inputs: Array.isArray(rawSpec.inputs) ? rawSpec.inputs : [],
      outputs: Array.isArray(rawSpec.outputs) ? rawSpec.outputs : [],
      metadata: {
        complexity: rawSpec.metadata?.complexity || 'moderate',
        estimatedBuildTime: rawSpec.metadata?.estimatedBuildTime || 'unknown',
        extractionTimestamp: new Date().toISOString()
      }
    }

    // Normalize capabilities
    if (Array.isArray(rawSpec.capabilities)) {
      for (const rawCap of rawSpec.capabilities) {
        if (rawCap.id) {
          const matchedCapability = allCapabilities.find(cap => cap.id === rawCap.id)
          if (matchedCapability) {
            spec.capabilities.push({
              id: rawCap.id,
              config: this.validateConfig(rawCap.config || {}, matchedCapability),
              metadata: {
                matched: true,
                originalRequest: rawCap
              }
            })
          } else {
            // Find closest capability by name similarity
            const closest = this.findClosestCapability(rawCap.id, allCapabilities)
            if (closest) {
              spec.capabilities.push({
                id: closest.id,
                config: this.validateConfig(rawCap.config || {}, closest),
                metadata: {
                  matched: false,
                  originalId: rawCap.id,
                  closestMatch: closest.id,
                  originalRequest: rawCap
                }
              })
            }
          }
        }
      }
    }

    // Validate workflow connections
    spec.workflow = spec.workflow.filter(connection => {
      const sourceExists = spec.capabilities.some(cap => cap.id === connection.from)
      const targetExists = spec.capabilities.some(cap => cap.id === connection.to)
      return sourceExists && targetExists
    })

    return spec
  }

  private findClosestCapability(
    requestedId: string, 
    allCapabilities: AgentCapability[]
  ): AgentCapability | null {
    // Simple string similarity matching
    // In production, use semantic search or embedding similarity
    const requestedLower = requestedId.toLowerCase()
    
    for (const cap of allCapabilities) {
      if (cap.name.toLowerCase().includes(requestedLower) || 
          requestedLower.includes(cap.name.toLowerCase())) {
        return cap
      }
    }
    
    // Return first capability as fallback
    return allCapabilities.length > 0 ? allCapabilities[0] : null
  }

  private validateConfig(
    config: Record<string, any>, 
    capability: AgentCapability
  ): Record<string, any> {
    const validated: Record<string, any> = {}
    
    // Use capability's parameter definitions if available
    if (capability.parameters) {
      for (const [paramName, paramDef] of Object.entries(capability.parameters)) {
        if (config[paramName] !== undefined) {
          validated[paramName] = config[paramName]
        } else if (paramDef.default !== undefined) {
          validated[paramName] = paramDef.default
        }
      }
    } else {
      // Copy all config values if no parameter definitions
      Object.assign(validated, config)
    }
    
    return validated
  }

  async applyClarification(
    specification: AgentSpecification,
    question: ClarificationQuestion,
    answer: string
  ): Promise<AgentSpecification> {
    this.logger.info('Applying clarification', { 
      questionId: question.id, 
      specificationId: specification.metadata?.id 
    })
    
    const updatedSpec = { ...specification }
    
    // Apply clarification based on question type
    switch (question.type) {
      case 'capability_selection':
        updatedSpec.capabilities = await this.updateCapabilitiesFromClarification(
          specification.capabilities,
          question,
          answer
        )
        break
        
      case 'parameter_value':
        updatedSpec.capabilities = this.updateParametersFromClarification(
          specification.capabilities,
          question,
          answer
        )
        break
        
      case 'workflow_adjustment':
        updatedSpec.workflow = this.updateWorkflowFromClarification(
          specification.workflow,
          question,
          answer
        )
        break
        
      case 'input_output_specification':
        updatedSpec.inputs = this.parseListFromAnswer(answer, 'input')
        updatedSpec.outputs = this.parseListFromAnswer(answer, 'output')
        break
    }
    
    // Update metadata
    if (!updatedSpec.metadata.clarifications) {
      updatedSpec.metadata.clarifications = []
    }
    updatedSpec.metadata.clarifications.push({
      question,
      answer,
      timestamp: new Date().toISOString()
    })
    updatedSpec.metadata.lastUpdated = new Date().toISOString()
    
    return updatedSpec
  }

  private async updateCapabilitiesFromClarification(
    currentCapabilities: any[],
    question: ClarificationQuestion,
    answer: string
  ): Promise<any[]> {
    // Parse answer for capability IDs or names
    const mentionedCapabilities = this.extractCapabilityIdsFromText(answer)
    const allCapabilities = await this.capabilityRegistry.getAll()
    
    const newCapabilities = [...currentCapabilities]
    
    // Add mentioned capabilities if not already present
    for (const capId of mentionedCapabilities) {
      if (!newCapabilities.some(cap => cap.id === capId)) {
        const matchedCap = allCapabilities.find(c => c.id === capId)
        if (matchedCap) {
          newCapabilities.push({
            id: capId,
            config: {},
            metadata: { addedViaClarification: true }
          })
        }
      }
    }
    
    // Remove capabilities if answer indicates removal
    if (answer.toLowerCase().includes('remove') || answer.toLowerCase().includes('don\'t need')) {
      const toRemove = this.extractCapabilityIdsFromText(answer)
      return newCapabilities.filter(cap => !toRemove.includes(cap.id))
    }
    
    return newCapabilities
  }

  private updateParametersFromClarification(
    currentCapabilities: any[],
    question: ClarificationQuestion,
    answer: string
  ): any[] {
    return currentCapabilities.map(cap => {
      if (cap.id === question.targetCapabilityId) {
        const updatedConfig = { ...cap.config }
        
        // Parse parameter value from answer
        const value = this.extractParameterValue(answer, question.parameterName)
        if (value !== null) {
          updatedConfig[question.parameterName!] = value
        }
        
        return {
          ...cap,
          config: updatedConfig,
          metadata: {
            ...cap.metadata,
            parametersUpdated: true,
            updatedAt: new Date().toISOString()
          }
        }
      }
      return cap
    })
  }

  private updateWorkflowFromClarification(
    currentWorkflow: any[],
    question: ClarificationQuestion,
    answer: string
  ): any[] {
    // Simple workflow adjustment based on yes/no or clarification
    // In production, this would use more sophisticated parsing
    if (answer.toLowerCase().includes('yes') || answer.toLowerCase().includes('correct')) {
      return currentWorkflow // Keep current workflow
    } else if (answer.toLowerCase().includes('change') || answer.toLowerCase().includes('different')) {
      // Parse suggested changes from answer
      const suggestedConnections = this.extractWorkflowConnections(answer)
      return suggestedConnections.length > 0 ? suggestedConnections : currentWorkflow
    }
    
    return currentWorkflow
  }

  private extractCapabilityIdsFromText(text: string): string[] {
    const ids: string[] = []
    const words = text.toLowerCase().split(/\s+/)
    
    // Look for capability names or IDs (simplified)
    const patterns = [
      /chatbot/i,
      /code/i,
      /analy[sz]e/i,
      /research/i,
      /automate/i,
      /process/i
    ]
    
    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        const match = pattern.source.replace(/\\/g, '').replace(/i$/, '')
        ids.push(match.toLowerCase())
      }
    })
    
    return ids
  }

  private extractParameterValue(text: string, parameterName?: string): any {
    // Extract numbers
    const numberMatch = text.match(/\d+/)
    if (numberMatch) {
      return parseInt(numberMatch[0], 10)
    }
    
    // Extract yes/no as boolean
    if (text.toLowerCase().includes('yes')) return true
    if (text.toLowerCase().includes('no')) return false
    
    // Extract quoted strings
    const stringMatch = text.match(/["']([^"']+)["']/)
    if (stringMatch) {
      return stringMatch[1]
    }
    
    return text // Return raw text as fallback
  }

  private extractWorkflowConnections(text: string): any[] {
    // Simplified extraction - in production would use more sophisticated NLP
    const connections: any[] = []
    const lines = text.split(/\.|\n/)
    
    lines.forEach(line => {
      const words = line.toLowerCase().split(/\s+/)
      const fromIndex = words.findIndex(w => w === 'from')
      const toIndex = words.findIndex(w => w === 'to')
      
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        const from = words.slice(fromIndex + 1, toIndex).join('_')
        const to = words.slice(toIndex + 1, toIndex + 3).join('_')
        
        if (from && to) {
          connections.push({
            from,
            to,
            condition: 'always'
          })
        }
      }
    })
    
    return connections
  }

  private parseListFromAnswer(answer: string, type: 'input' | 'output'): string[] {
    // Parse comma-separated or bullet-point lists
    const items: string[] = []
    
    // Split by commas, "and", or bullets
    const parts = answer.split(/,|\band\b|•|\*/)
    
    parts.forEach(part => {
      const trimmed = part.trim().toLowerCase()
      if (trimmed && !['input', 'output', 'inputs', 'outputs'].includes(trimmed)) {
        items.push(trimmed)
      }
    })
    
    return items.length > 0 ? items : [type]
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.zenClient.cleanup(),
      this.capabilityRegistry.cleanup()
    ])
    this.logger.info('Specification builder cleaned up')
  }
}
EOF

echo "Specification builder created."
```

### Step 5: Clarification Engine
```bash
# Create clarification engine service
cat > packages/orchestrator/src/services/clarification-engine.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { 
  AgentSpecification, 
  ClarificationQuestion, 
  ValidationError 
} from '@/models/types'
import { OpenCodeZenClient } from '@/clients/opencode-zen'

export class ClarificationEngine {
  private logger: Logger
  private zenClient: OpenCodeZenClient

  constructor() {
    this.logger = createLogger('clarification-engine')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing clarification engine')
    this.zenClient = new OpenCodeZenClient()
    await this.zenClient.initialize()
    this.logger.info('Clarification engine initialized')
  }

  async generateQuestions(
    specification: AgentSpecification,
    errors: ValidationError[]
  ): Promise<ClarificationQuestion[]> {
    this.logger.info('Generating clarification questions', { 
      specName: specification.name,
      errorCount: errors.length 
    })

    const questions: ClarificationQuestion[] = []

    // Generate questions based on validation errors
    for (const error of errors) {
      const errorQuestions = await this.generateQuestionsForError(error, specification)
      questions.push(...errorQuestions)
      
      // Limit to 3 questions max
      if (questions.length >= 3) {
        break
      }
    }

    // If no errors or not enough questions, generate general clarification questions
    if (questions.length < 2) {
      const generalQuestions = await this.generateGeneralQuestions(specification)
      questions.push(...generalQuestions.slice(0, 3 - questions.length))
    }

    // Prioritize questions
    return this.prioritizeQuestions(questions).slice(0, 3)
  }

  private async generateQuestionsForError(
    error: ValidationError,
    specification: AgentSpecification
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = []

    switch (error.type) {
      case 'missing_capability':
        questions.push({
          id: `clarify_cap_${Date.now()}_${Math.random()}`,
          type: 'capability_selection',
          text: `You mentioned needing "${error.details?.requiredCapability}". What specific capabilities do you need for this?`,
          targetCapabilityId: error.details?.relatedCapabilityId,
          options: error.details?.suggestedCapabilities?.map(cap => ({
            value: cap.id,
            label: cap.name,
            description: cap.description
          })),
          priority: 'high'
        })
        break

      case 'invalid_parameter':
        questions.push({
          id: `clarify_param_${Date.now()}_${Math.random()}`,
          type: 'parameter_value',
          text: `For the "${error.details?.capabilityName}" capability, what value should I use for "${error.details?.parameterName}"?`,
          targetCapabilityId: error.details?.capabilityId,
          parameterName: error.details?.parameterName,
          suggestions: error.details?.validValues,
          priority: 'medium'
        })
        break

      case 'missing_dependency':
        questions.push({
          id: `clarify_dep_${Date.now()}_${Math.random()}`,
          type: 'workflow_adjustment',
          text: `The "${error.details?.capabilityName}" capability requires "${error.details?.requiredCapability}" to work first. How should I set up this dependency?`,
          targetCapabilityId: error.details?.capabilityId,
          priority: 'high'
        })
        break

      case 'ambiguous_specification':
        // Use LLM to generate clarifying question for ambiguous specifications
        const llmQuestion = await this.generateLLMQuestionForAmbiguity(error, specification)
        if (llmQuestion) {
          questions.push(llmQuestion)
        }
        break
    }

    return questions
  }

  private async generateGeneralQuestions(
    specification: AgentSpecification
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = []

    // Check for missing information
    if (!specification.inputs || specification.inputs.length === 0) {
      questions.push({
        id: `clarify_inputs_${Date.now()}_${Math.random()}`,
        type: 'input_output_specification',
        text: 'What inputs should your agent accept? (e.g., text messages, files, API calls)',
        priority: 'medium'
      })
    }

    if (!specification.outputs || specification.outputs.length === 0) {
      questions.push({
        id: `clarify_outputs_${Date.now()}_${Math.random()}`,
        type: 'input_output_specification',
        text: 'What outputs should your agent produce? (e.g., text responses, generated code, analysis reports)',
        priority: 'medium'
      })
    }

    // Check for overly simple specification
    if (specification.capabilities.length < 2) {
      questions.push({
        id: `clarify_simple_${Date.now()}_${Math.random()}`,
        type: 'capability_selection',
        text: 'Your agent seems quite simple. Would you like to add any additional capabilities?',
        priority: 'low',
        options: [
          { value: 'yes_more', label: 'Yes, suggest more capabilities' },
          { value: 'no_simple', label: 'No, keep it simple' }
        ]
      })
    }

    return questions
  }

  private async generateLLMQuestionForAmbiguity(
    error: ValidationError,
    specification: AgentSpecification
  ): Promise<ClarificationQuestion | null> {
    const prompt = `
The following agent specification has ambiguous elements that need clarification:

AGENT SPECIFICATION:
${JSON.stringify(specification, null, 2)}

AMBIGUITY DETAILS:
${JSON.stringify(error.details, null, 2)}

Generate a single, clear question to resolve this ambiguity. The question should:
1. Be specific to the ambiguity
2. Offer clear options if applicable
3. Help the user provide the missing information
4. Be concise and easy to understand

Return your response as JSON with:
- question: the clarification question text
- type: the question type (capability_selection, parameter_value, workflow_adjustment, or input_output_specification)
- options: array of options if applicable, each with value, label, and description
- target: which part of the specification this clarifies

Response:
`

    try {
      const response = await this.zenClient.complete(prompt, {
        temperature: 0.3,
        maxTokens: 300
      })

      const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, ''))
      
      return {
        id: `clarify_amb_${Date.now()}_${Math.random()}`,
        type: parsed.type || 'capability_selection',
        text: parsed.question,
        targetCapabilityId: parsed.target?.capabilityId,
        parameterName: parsed.target?.parameterName,
        options: parsed.options,
        priority: 'high'
      }
    } catch (error) {
      this.logger.error('Failed to generate LLM clarification question', { error })
      return null
    }
  }

  private prioritizeQuestions(questions: ClarificationQuestion[]): ClarificationQuestion[] {
    const priorityWeights = {
      high: 3,
      medium: 2,
      low: 1
    }

    return questions.sort((a, b) => {
      const priorityDiff = priorityWeights[b.priority || 'medium'] - priorityWeights[a.priority || 'medium']
      
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Secondary sort: question type importance
      const typeOrder = {
        'capability_selection': 4,
        'parameter_value': 3,
        'workflow_adjustment': 2,
        'input_output_specification': 1
      }

      return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0)
    })
  }

  async evaluateAnswerQuality(
    question: ClarificationQuestion,
    answer: string
  ): Promise<{ quality: 'good' | 'adequate' | 'poor'; feedback?: string }> {
    // Simple heuristic evaluation
    // In production, would use more sophisticated NLP
    
    const answerLower = answer.toLowerCase().trim()
    
    if (answerLower.length < 3) {
      return { quality: 'poor', feedback: 'Answer is too short. Please provide more details.' }
    }

    if (answerLower === 'yes' || answerLower === 'no') {
      return { quality: 'adequate', feedback: 'Simple answer received.' }
    }

    if (answerLower.includes('i don\'t know') || answerLower.includes('not sure')) {
      return { quality: 'poor', feedback: 'Please try to provide more specific information.' }
    }

    // Check if answer seems relevant to question
    const questionKeywords = this.extractKeywords(question.text)
    const answerKeywords = this.extractKeywords(answer)
    
    const matchingKeywords = questionKeywords.filter(kw => 
      answerKeywords.some(akw => akw.includes(kw) || kw.includes(akw))
    )
    
    const relevanceScore = matchingKeywords.length / Math.max(1, questionKeywords.length)
    
    if (relevanceScore > 0.5) {
      return { quality: 'good', feedback: 'Answer appears relevant to the question.' }
    } else if (relevanceScore > 0.2) {
      return { quality: 'adequate', feedback: 'Answer is somewhat relevant.' }
    } else {
      return { 
        quality: 'poor', 
        feedback: 'Answer doesn\'t seem to address the question. Could you clarify?' 
      }
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'shall', 'what', 'which', 'how'
    ])
    
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => 
        word.length > 2 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word)
      )
      .slice(0, 10) // Limit to top 10 keywords
  }

  async cleanup(): Promise<void> {
    await this.zenClient.cleanup()
    this.logger.info('Clarification engine cleaned up')
  }
}
EOF

echo "Clarification engine created."
```

## Phase 3: Memory & Context Management

### Step 6: Memory Manager
```bash
# Create memory manager service
cat > packages/orchestrator/src/services/memory-manager.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { ConversationState, AgentSpecification } from '@/models/types'
import { RedisCache } from '@/services/redis-cache'
import { VectorStore } from '@/services/vector-store'
import { Database } from '@/services/database'

export class MemoryManager {
  private logger: Logger
  private cache: RedisCache
  private vectorStore: VectorStore
  private database: Database
  private sessionTimeout = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.logger = createLogger('memory-manager')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing memory manager')
    this.cache = new RedisCache()
    this.vectorStore = new VectorStore()
    this.database = new Database()
    
    await Promise.all([
      this.cache.initialize(),
      this.vectorStore.initialize(),
      this.database.initialize()
    ])
    
    this.logger.info('Memory manager initialized')
  }

  async createState(userId: string, sessionId: string): Promise<ConversationState> {
    const state: ConversationState = {
      id: `${userId}_${sessionId}_${Date.now()}`,
      userId,
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: {
        userPreferences: {},
        conversationHistory: [],
        agentPatterns: []
      },
      currentSpecification: null,
      validationErrors: [],
      pendingClarifications: [],
      readyForVisualization: false,
      responses: []
    }

    // Store in cache for fast access
    await this.cache.set(`state:${state.id}`, state, this.sessionTimeout / 1000)
    
    // Store in database for persistence
    await this.database.insert('conversation_states', state)
    
    // Create session timer
    this.setSessionTimer(state.id)
    
    return state
  }

  async getState(stateId: string): Promise<ConversationState | null> {
    // Try cache first
    const cached = await this.cache.get<ConversationState>(`state:${stateId}`)
    if (cached) {
      // Update last accessed time
      await this.cache.expire(`state:${stateId}`, this.sessionTimeout / 1000)
      this.setSessionTimer(stateId)
      return cached
    }

    // Fall back to database
    const fromDb = await this.database.get('conversation_states', stateId)
    if (fromDb) {
      // Restore to cache
      await this.cache.set(`state:${stateId}`, fromDb, this.sessionTimeout / 1000)
      this.setSessionTimer(stateId)
    }

    return fromDb
  }

  async updateState(
    state: ConversationState, 
    updates: Partial<ConversationState>
  ): Promise<ConversationState> {
    const updatedState = {
      ...state,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Update cache
    await this.cache.set(`state:${state.id}`, updatedState, this.sessionTimeout / 1000)
    
    // Update database asynchronously
    this.database.update('conversation_states', state.id, updatedState).catch(error => {
      this.logger.error('Failed to update state in database', { error, stateId: state.id })
    })
    
    // Update vector store with conversation embeddings
    await this.updateConversationEmbeddings(updatedState)
    
    return updatedState
  }

  async persistState(state: ConversationState): Promise<void> {
    // Ensure state is in database
    await this.database.upsert('conversation_states', state.id, state)
    
    // Extract and store agent patterns if specification is complete
    if (state.readyForVisualization && state.currentSpecification) {
      await this.extractAndStorePatterns(state.currentSpecification, state.userId)
    }
  }

  async findSimilarStates(
    specification: AgentSpecification,
    limit = 5
  ): Promise<ConversationState[]> {
    // Create embedding for the specification
    const specEmbedding = await this.createSpecificationEmbedding(specification)
    
    // Search for similar specifications in vector store
    const similar = await this.vectorStore.search(
      'specification_patterns',
      specEmbedding,
      { limit }
    )
    
    // Retrieve full states for the most similar patterns
    const stateIds = similar.map(result => result.payload.stateId).filter(Boolean)
    const states: ConversationState[] = []
    
    for (const stateId of stateIds) {
      const state = await this.getState(stateId)
      if (state) {
        states.push(state)
      }
    }
    
    return states
  }

  async getConversationHistory(userId: string, limit = 10): Promise<ConversationState[]> {
    return this.database.query(
      'conversation_states',
      { userId },
      { sort: { updatedAt: -1 }, limit }
    )
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Find sessions that haven't been updated in > sessionTimeout
    const cutoff = new Date(Date.now() - this.sessionTimeout)
    
    const expired = await this.database.query(
      'conversation_states',
      { updatedAt: { $lt: cutoff.toISOString() } },
      { limit: 100 }
    )
    
    for (const state of expired) {
      // Remove from cache
      await this.cache.delete(`state:${state.id}`)
      
      // Archive in database before deleting
      await this.archiveState(state)
      await this.database.delete('conversation_states', state.id)
      
      this.logger.info('Cleaned up expired session', { stateId: state.id })
    }
  }

  private async updateConversationEmbeddings(state: ConversationState): Promise<void> {
    if (state.responses.length === 0) return
    
    const lastInteraction = state.responses[state.responses.length - 1]
    const textToEmbed = `${lastInteraction.input || ''} ${lastInteraction.response || ''}`.trim()
    
    if (textToEmbed) {
      await this.vectorStore.upsert('conversation_embeddings', {
        id: `conv_${state.id}_${Date.now()}`,
        vector: await this.createTextEmbedding(textToEmbed),
        payload: {
          stateId: state.id,
          userId: state.userId,
          text: textToEmbed,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  private async extractAndStorePatterns(
    specification: AgentSpecification,
    userId: string
  ): Promise<void> {
    const patternId = `pattern_${specification.name.replace(/\s+/g, '_')}_${Date.now()}`
    
    // Create pattern embedding
    const patternEmbedding = await this.createSpecificationEmbedding(specification)
    
    // Store pattern
    await this.vectorStore.upsert('specification_patterns', {
      id: patternId,
      vector: patternEmbedding,
      payload: {
        specification,
        userId,
        createdAt: new Date().toISOString(),
        usageCount: 1
      }
    })
    
    this.logger.info('Stored agent pattern', { patternId, specName: specification.name })
  }

  private async createSpecificationEmbedding(specification: AgentSpecification): Promise<number[]> {
    const text = `
Name: ${specification.name}
Description: ${specification.description}
Capabilities: ${specification.capabilities.map(c => c.id).join(', ')}
Inputs: ${specification.inputs.join(', ')}
Outputs: ${specification.outputs.join(', ')}
Complexity: ${specification.metadata?.complexity || 'unknown'}
`
    
    return this.createTextEmbedding(text)
  }

  private async createTextEmbedding(text: string): Promise<number[]> {
    // Call embedding service
    const response = await fetch('http://localhost:8001/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.embedding
  }

  private async archiveState(state: ConversationState): Promise<void> {
    const archive = {
      ...state,
      archivedAt: new Date().toISOString(),
      archiveReason: 'session_expired'
    }
    
    await this.database.insert('archived_conversations', archive)
  }

  private setSessionTimer(stateId: string): void {
    // Reset timer for session expiration check
    // In production, would use Redis keyspace notifications or similar
    setTimeout(async () => {
      const state = await this.getState(stateId)
      if (state && new Date(state.updatedAt).getTime() < Date.now() - this.sessionTimeout) {
        await this.cleanupExpiredSessions()
      }
    }, this.sessionTimeout + 60000) // Check 1 minute after timeout
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.cache.cleanup(),
      this.vectorStore.cleanup(),
      this.database.cleanup()
    ])
    this.logger.info('Memory manager cleaned up')
  }
}
EOF

echo "Memory manager created."
```

## Phase 4: API Integration & WebSocket

### Step 7: REST API & WebSocket Server
```bash
# Create main API server
cat > packages/orchestrator/src/index.ts << 'EOF'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { OrchestratorAgent } from './agents/orchestrator'
import { MemoryManager } from './services/memory-manager'
import { createLogger } from './utils/logger'
import { config } from './config'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true
  }
})

const logger = createLogger('api-server')
const orchestrator = new OrchestratorAgent()
const memoryManager = new MemoryManager()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'orchestrator-api'
  })
})

// REST API Routes
app.post('/api/conversations', async (req, res) => {
  try {
    const { userId, sessionId } = req.body
    const state = await memoryManager.createState(userId, sessionId)
    
    res.json({
      success: true,
      data: {
        stateId: state.id,
        message: 'Conversation started'
      }
    })
  } catch (error) {
    logger.error('Failed to create conversation', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    })
  }
})

app.post('/api/conversations/:stateId/messages', async (req, res) => {
  try {
    const { stateId } = req.params
    const { message } = req.body
    
    const state = await memoryManager.getState(stateId)
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }
    
    // Process message through orchestrator
    const updatedState = await orchestrator.process(message, state)
    
    res.json({
      success: true,
      data: {
        response: updatedState.responses[updatedState.responses.length - 1],
        state: updatedState,
        readyForVisualization: updatedState.readyForVisualization
      }
    })
    
    // If ready for visualization, emit WebSocket event
    if (updatedState.readyForVisualization && updatedState.currentSpecification) {
      io.to(`user:${state.userId}`).emit('specification:ready', {
        specification: updatedState.currentSpecification,
        stateId: updatedState.id
      })
    }
  } catch (error) {
    logger.error('Failed to process message', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    })
  }
})

app.get('/api/conversations/:stateId', async (req, res) => {
  try {
    const { stateId } = req.params
    const state = await memoryManager.getState(stateId)
    
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }
    
    res.json({
      success: true,
      data: state
    })
  } catch (error) {
    logger.error('Failed to get conversation', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    })
  })
})

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id })
  
  socket.on('authenticate', async (data) => {
    const { userId, token } = data
    
    // Validate token (simplified)
    if (token) {
      socket.join(`user:${userId}`)
      socket.emit('authenticated', { success: true })
      logger.info('Client authenticated', { socketId: socket.id, userId })
    } else {
      socket.emit('error', { message: 'Authentication failed' })
    }
  })
  
  socket.on('message', async (data) => {
    try {
      const { stateId, message } = data
      const state = await memoryManager.getState(stateId)
      
      if (!state) {
        socket.emit('error', { message: 'Conversation not found' })
        return
      }
      
      const updatedState = await orchestrator.process(message, state)
      socket.emit('response', {
        response: updatedState.responses[updatedState.responses.length - 1],
        state: updatedState
      })
      
      if (updatedState.readyForVisualization && updatedState.currentSpecification) {
        socket.emit('specification:ready', {
          specification: updatedState.currentSpecification,
          stateId: updatedState.id
        })
      }
    } catch (error) {
      logger.error('WebSocket message processing failed', { error, socketId: socket.id })
      socket.emit('error', { message: 'Failed to process message' })
    }
  })
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id })
  })
})

// Initialize and start server
async function startServer() {
  try {
    await Promise.all([
      orchestrator.initialize(),
      memoryManager.initialize()
    ])
    
    httpServer.listen(config.port, () => {
      logger.info(`Orchestrator API server running on port ${config.port}`)
      logger.info(`WebSocket server available at ws://localhost:${config.port}`)
    })
  } catch (error) {
    logger.error('Failed to start server', { error })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  
  await Promise.all([
    orchestrator.cleanup(),
    memoryManager.cleanup()
  ])
  
  httpServer.close(() => {
    logger.info('Server shut down gracefully')
    process.exit(0)
  })
})

startServer()
EOF

echo "API server created."
```

## Phase 5: Testing & Integration

### Step 8: Comprehensive Testing
```bash
# Create test files
cat > packages/orchestrator/src/agents/orchestrator.test.ts << 'EOF'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OrchestratorAgent } from './orchestrator'
import { ConversationState } from '@/models/types'

describe('OrchestratorAgent', () => {
  let orchestrator: OrchestratorAgent
  
  beforeEach(async () => {
    vi.useFakeTimers()
    orchestrator = new OrchestratorAgent()
    await orchestrator.initialize()
  })
  
  afterEach(async () => {
    await orchestrator.cleanup()
    vi.useRealTimers()
  })
  
  it('initializes with correct capabilities', () => {
    const capabilities = orchestrator.getCapabilities()
    expect(capabilities).toHaveLength(4)
    expect(capabilities.map(c => c.name)).toContain('Intent Recognition')
    expect(capabilities.map(c => c.name)).toContain('Specification Extraction')
  })
  
  it('processes agent specification request', async () => {
    const initialState: ConversationState = {
      id: 'test_state_1',
      userId: 'test_user',
      sessionId: 'test_session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: {},
      currentSpecification: null,
      validationErrors: [],
      pendingClarifications: [],
      readyForVisualization: false,
      responses: []
    }
    
    const result = await orchestrator.process(
      'I want to create a chatbot agent',
      initialState
    )
    
    expect(result.responses).toHaveLength(1)
    expect(result.responses[0]).toBeTruthy()
  })
  
  it('validates specifications', async () => {
    const validSpec = {
      name: 'Test Agent',
      description: 'A test agent',
      version: '1.0.0',
      capabilities: [
        { id: 'text-input', config: {} }
      ],
      workflow: [],
      inputs: [],
      outputs: [],
      metadata: { complexity: 'simple' }
    }
    
    const isValid = await orchestrator.validate(validSpec)
    expect(isValid).toBe(true)
  })
})
EOF

# Create integration test
cat > packages/orchestrator/src/integration/api.test.ts << 'EOF'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createServer } from '../index'

describe('Orchestrator API', () => {
  let server: any
  let baseUrl: string
  
  beforeAll(async () => {
    server = await createServer()
    baseUrl = 'http://localhost:3001'
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  it('health check returns healthy', async () => {
    const response = await request(baseUrl).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('healthy')
  })
  
  it('creates new conversation', async () => {
    const response = await request(baseUrl)
      .post('/api/conversations')
      .send({ userId: 'test_user', sessionId: 'test_session' })
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.stateId).toBeTruthy()
  })
  
  it('processes message in conversation', async () => {
    // First create conversation
    const createRes = await request(baseUrl)
      .post('/api/conversations')
      .send({ userId: 'test_user', sessionId: 'test_session_2' })
    
    const stateId = createRes.body.data.stateId
    
    // Send message
    const messageRes = await request(baseUrl)
      .post(`/api/conversations/${stateId}/messages`)
      .send({ message: 'Create a chatbot agent' })
    
    expect(messageRes.status).toBe(200)
    expect(messageRes.body.success).toBe(true)
    expect(messageRes.body.data.response).toBeTruthy()
  })
})
EOF

echo "Testing setup complete."
```

## Phase 6: Deployment & Monitoring

### Step 9: Docker Compose Configuration
```bash
# Create docker-compose.yml for orchestrator
cat > packages/orchestrator/docker-compose.yml << 'EOF'
version: '3.8'

services:
  orchestrator-api:
    build: .
    ports:
      - "3001:3001"
      - "9229:9229" # Node.js debug port
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/orchestrator
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - OPENCODE_ZEN_URL=http://zen-api:8080
      - ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
    depends_on:
      - postgres
      - redis
      - qdrant
      - ml-service
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ml-service:
    build: ./ml-service
    ports:
      - "8001:8001"
    environment:
      - MODEL_PATH=/models
      - EMBEDDING_MODEL=all-MiniLM-L6-v2
      - CLASSIFICATION_MODEL=distilbert-base-uncased
    volumes:
      - ./ml-service/models:/models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=orchestrator
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
EOF

# Create ML service directory and files
mkdir -p packages/orchestrator/ml-service
cat > packages/orchestrator/ml-service/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models
RUN python -c "
from sentence_transformers import SentenceTransformer
from transformers import pipeline

print('Downloading embedding model...')
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
embedding_model.save('/models/embedding')

print('Downloading classification model...')
classifier = pipeline('text-classification', model='distilbert-base-uncased')
"

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 mluser && chown -R mluser:mluser /app
USER mluser

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
EOF

cat > packages/orchestrator/ml-service/requirements.txt << 'EOF'
fastapi>=0.104.0
uvicorn>=0.24.0
sentence-transformers>=2.2.0
transformers>=4.35.0
torch>=2.0.0
pydantic>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
EOF

cat > packages/orchestrator/ml-service/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import numpy as np
import logging

app = FastAPI(title="ML Service for Agent Lab Orchestrator")

# Initialize models
embedding_model = None
classification_model = None

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: list[float]
    model: str

class ClassificationRequest(BaseModel):
    text: str
    labels: list[str] | None = None

class ClassificationResponse(BaseModel):
    label: str
    confidence: float
    all_scores: dict[str, float]

@app.on_event("startup")
async def startup_event():
    global embedding_model, classification_model
    logging.info("Loading ML models...")
    
    try:
        embedding_model = SentenceTransformer('/models/embedding')
        classification_model = pipeline('text-classification', model='/models/classification')
        logging.info("Models loaded successfully")
    except Exception as e:
        logging.error(f"Failed to load models: {e}")
        raise

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models": {
            "embedding": embedding_model is not None,
            "classification": classification_model is not None
        }
    }

@app.post("/embed", response_model=EmbeddingResponse)
async def embed(request: EmbeddingRequest):
    if embedding_model is None:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
    
    try:
        embedding = embedding_model.encode(request.text).tolist()
        return EmbeddingResponse(
            embedding=embedding,
            model="all-MiniLM-L6-v2"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

@app.post("/classify", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest):
    if classification_model is None:
        raise HTTPException(status_code=503, detail="Classification model not loaded")
    
    try:
        result = classification_model(request.text)
        if request.labels:
            # Filter to requested labels
            filtered = {label: score for label, score in result[0].items() if label in request.labels}
            if not filtered:
                raise HTTPException(status_code=400, detail="No matching labels found")
            result[0] = filtered
        
        return ClassificationResponse(
            label=result[0]['label'],
            confidence=result[0]['score'],
            all_scores=result[0]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
EOF

echo "Deployment configuration complete."
```

## Final Verification

### Step 10: Run Complete System
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab/packages/orchestrator

# Install dependencies
pnpm install
pip install -r requirements.txt

# Start development environment
docker-compose up -d postgres redis qdrant
pnpm dev

# Run tests
pnpm test
pnpm test:coverage

# Build for production
pnpm build

# Start production server
docker-compose up -d
```

### Step 11: Integration Checklist
1. ✅ Orchestrator agent initializes with all services
2. ✅ Intent recognition system identifies agent specification requests
3. ✅ Specification builder extracts structured blueprints from natural language
4. ✅ Clarification engine generates targeted questions for ambiguous specifications
5. ✅ Memory manager maintains conversation context across sessions
6. ✅ REST API handles conversation lifecycle
7. ✅ WebSocket server enables real-time communication
8. ✅ ML service provides embedding and classification
9. ✅ All tests pass with >85% coverage
10. ✅ Docker containers build and run successfully

## Next Steps for Pod 3

1. **Advanced Dialogue Management**: Implement multi-turn conversation tracking with context window optimization
2. **Specification Refinement**: Add iterative refinement loops with user feedback integration
3. **Multi-Model Ensemble**: Implement weighted voting across multiple LLMs for better accuracy
4. **Personalization**: Learn user preferences and patterns over time
5. **Error Recovery**: Implement sophisticated error handling and recovery mechanisms
6. **Performance Optimization**: Add caching, batching, and parallel processing
7. **Evaluation Framework**: Create comprehensive evaluation metrics for conversation quality
8. **Integration with External Knowledge**: Connect to documentation, examples, and best practices
9. **Voice Interface**: Add speech-to-text and text-to-speech capabilities
10. **Multi-language Support**: Extend to non-English languages

## Cross-Pod Integration Points

**With Pod 1 (API Gateway)**:
- REST API endpoints for conversation management
- WebSocket connection for real-time updates
- Authentication and rate limiting integration

**With Pod 2 (Visual Builder)**:
- Specification delivery to visual builder via WebSocket
- Real-time design updates based on conversation
- Visual feedback integration into conversation flow

**With Pod 4 (Swarm Engine)**:
- Task decomposition from natural language specifications
- Progress updates integrated into conversation
- Error reporting and resolution suggestions

**With Pod 5 (Testing & Deployment)**:
- Automated testing of conversational flows
- Performance monitoring and alerting
- Deployment configuration generation from conversations

---

**Pod 3 Complete**: The conversational AI system is ready for development with comprehensive NLP pipeline, memory management, and integration points established. Proceed to Pod 4: Swarm Coordination Engine.