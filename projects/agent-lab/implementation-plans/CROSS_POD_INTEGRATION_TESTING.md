# Cross-Pod Integration Testing Strategy

## Overview
Comprehensive testing strategy to ensure seamless integration between all 5 Agent Lab pods. Focus on end-to-end workflows, API contracts, and real-time communication.

## Testing Pyramid

### Level 1: Unit Tests (Within Pods)
- **Scope**: Individual components and functions within each pod
- **Tools**: Vitest for TypeScript, Jest for React components
- **Coverage Goal**: >90% for critical paths
- **Ownership**: Individual pod teams

### Level 2: Integration Tests (Between Pods)
- **Scope**: API contracts and communication between pods
- **Tools**: Vitest with custom test runners, Docker Compose
- **Coverage Goal**: 100% of public APIs
- **Ownership**: Cross-pod integration team

### Level 3: End-to-End Tests (Full Workflows)
- **Scope**: Complete user workflows across all pods
- **Tools**: Playwright for browser automation
- **Coverage Goal**: All critical user journeys
- **Ownership**: Quality assurance team

### Level 4: Performance & Load Tests
- **Scope**: System performance under load
- **Tools**: k6, Artillery, custom monitoring
- **Coverage Goal**: Key performance indicators
- **Ownership**: DevOps team

## Integration Test Scenarios

### Scenario 1: Agent Creation Workflow
**Path**: Pod 3 → Pod 2 → Pod 1 → Pod 4 → Pod 5

1. **Conversational Specification** (Pod 3)
   - User describes agent in natural language
   - Pod 3 generates structured agent specification
   - API Call: `POST /api/v1/specifications`

2. **Visual Design** (Pod 2)
   - Specification imported into visual builder
   - User customizes agent appearance
   - Real-time preview updates
   - WebSocket: Specification updates

3. **Configuration Validation** (Pod 1)
   - Agent specification validated
   - Resources allocated
   - API Call: `POST /api/v1/agents/validate`

4. **Build Execution** (Pod 4)
   - Task decomposition and scheduling
   - Shark agent swarm coordination
   - API Call: `POST /api/v1/builds`

5. **Deployment & Testing** (Pod 5)
   - Automated testing execution
   - Container building and deployment
   - Monitoring setup
   - API Call: `POST /api/v1/deployments`

### Scenario 2: Real-time Collaboration
**Path**: Pod 2 ↔ Pod 1 ↔ Pod 3

1. **Multi-user Editing** (Pod 2)
   - Multiple users editing same agent
   - Real-time cursor sharing
   - Change conflict resolution

2. **Session Management** (Pod 1)
   - WebSocket connection management
   - Permission validation
   - Resource isolation

3. **Conversational Context** (Pod 3)
   - Shared dialogue context
   - Collaborative specification refinement
   - Intent recognition for multiple users

### Scenario 3: Monitoring & Observability
**Path**: Pod 5 → All Pods

1. **Metrics Collection** (All Pods)
   - OpenTelemetry instrumentation
   - Custom metrics for each pod
   - Health check endpoints

2. **Centralized Monitoring** (Pod 5)
   - Prometheus metrics aggregation
   - Grafana dashboard integration
   - Alerting and notification system

## Test Environment Setup

### Local Development
```yaml
# docker-compose.test.yml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
  
  # All pods running in test mode
  pod1:
    build: ./packages/pod1-kraken-os-integration
    environment:
      NODE_ENV: test
      REDIS_URL: redis://redis:6379
  
  pod2:
    build: ./packages/pod2-visual-builder-frontend
    environment:
      NODE_ENV: test
      API_URL: http://pod1:3000
  
  # ... other pods
```

### CI/CD Pipeline
```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
      postgres:
        image: postgres:16-alpine
        env: ...
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Build packages
        run: bun run build
      
      - name: Run integration tests
        run: bun run test:integration
      
      - name: Run E2E tests
        run: bun run test:e2e
```

## API Contract Testing

### OpenAPI/Swagger Specifications
Each pod must provide OpenAPI 3.0 specification for its public APIs. Contract tests validate:
- Request/response schemas
- Error formats
- Authentication requirements
- Rate limiting headers

### Contract Test Example
```typescript
import { test } from 'vitest';
import { createTestClient } from './test-utils';

test('Pod 1 API contract', async () => {
  const client = createTestClient();
  
  // Test agent creation endpoint
  const response = await client.post('/api/v1/agents', {
    name: 'Test Agent',
    capabilities: ['code-generation']
  });
  
  // Validate response matches schema
  expect(response.status).toBe(201);
  expect(response.body).toMatchSchema(AgentSchema);
  
  // Validate error responses
  const errorResponse = await client.post('/api/v1/agents', {});
  expect(errorResponse.status).toBe(400);
  expect(errorResponse.body).toMatchSchema(ErrorSchema);
});
```

## Real-time Communication Testing

### WebSocket Contract Testing
```typescript
test('Real-time agent updates', async () => {
  const socket = createWebSocketClient();
  
  // Subscribe to agent updates
  socket.emit('subscribe', { agentId: 'test-123' });
  
  // Simulate update from another client
  await simulateUpdate('test-123', { name: 'Updated Agent' });
  
  // Verify update received
  const update = await waitForEvent(socket, 'agent-update');
  expect(update.agentId).toBe('test-123');
  expect(update.data.name).toBe('Updated Agent');
});
```

## Performance Testing

### Load Test Scenarios
1. **Concurrent Agent Creation**: 100 users creating agents simultaneously
2. **Real-time Collaboration**: 50 users editing same agent
3. **Build Queue Processing**: 1000 build tasks in queue
4. **API Endpoint Load**: 1000 RPS to critical endpoints

### Performance Benchmarks
- **P95 Response Time**: < 500ms for all APIs
- **WebSocket Latency**: < 100ms for real-time updates
- **Build Queue Processing**: < 10s average wait time
- **Memory Usage**: < 2GB per pod under load

## Security Testing

### Integration Security Tests
1. **Authentication flow**: OAuth2 token validation across pods
2. **Authorization checks**: Role-based access control
3. **Data isolation**: Multi-tenant data separation
4. **Input validation**: Cross-pod request validation
5. **Security headers**: Consistent security headers

### Penetration Testing Scenarios
1. **WebSocket hijacking**: Attempt to access unauthorized channels
2. **API token leakage**: Test token validation across pods
3. **Data injection**: Attempt SQL/NoSQL injection through APIs
4. **Denial of service**: Test rate limiting and resource protection

## Test Data Management

### Fixture Strategy
```typescript
// Shared test fixtures across pods
export const testAgents = {
  simpleAgent: {
    name: 'Simple Agent',
    capabilities: ['code-generation'],
    tools: [...]
  },
  complexAgent: {
    name: 'Complex Agent',
    capabilities: ['code-generation', 'testing', 'deployment'],
    tools: [...]
  }
};

// Factory functions for test data
export function createAgent(overrides = {}) {
  return {
    id: generateId(),
    name: `Test Agent ${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}
```

### Database Seeding
```typescript
// Cross-pod database seeding
export async function seedIntegrationTestData() {
  // Seed shared data needed for integration tests
  await seedUsers();
  await seedAgents();
  await seedBuilds();
  await seedDeployments();
}
```

## Monitoring & Reporting

### Test Results Dashboard
- **Test Coverage**: Integration test coverage per API endpoint
- **Performance Trends**: Response time trends over time
- **Failure Analysis**: Root cause analysis for test failures
- **Flaky Test Detection**: Identify and track flaky tests

### Alerting
- **Critical Test Failures**: Immediate notification to on-call engineer
- **Performance Regression**: Alert when performance degrades beyond threshold
- **Coverage Drops**: Alert when test coverage falls below target

## Continuous Improvement

### Feedback Loop
1. **Test failures** trigger root cause analysis
2. **Performance regressions** trigger optimization work
3. **Coverage gaps** trigger additional test creation
4. **Flaky tests** trigger investigation and fixing

### Regular Review
- Weekly review of integration test results
- Monthly review of performance benchmarks
- Quarterly security test review
- Bi-annual penetration testing