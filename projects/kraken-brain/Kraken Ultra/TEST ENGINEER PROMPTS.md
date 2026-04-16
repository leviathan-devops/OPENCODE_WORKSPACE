# TEST ENGINEER PROMPTS

**Purpose**: Validation and testing with Nemotron Communication Layer
**Created**: Mar 26 2026

---

## Test Engineer #1 - Guardian + Workflow v2-IntegrationTest

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `TEST TASK: Guardian + Workflow Integration Testing

TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/

REQUIREMENTS:
1. Test Guardian file protection in Opencode context
2. Verify Workflow 5-step enforcement (PLAN→BUILD→TEST→VERIFY→SHIP)
3. Test Guardian blocks system file access (/.ssh, /etc/passwd)
4. Verify Workflow blocks invalid state transitions
5. Test 3-failure reset mechanism
6. Cross-module validation (Guardian ↔ Workflow)
7. Create test logs with mechanical evidence

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Messages use ONLY tokens needed

TEST SCENARIOS:
1. Attempt to write to /.ssh/authorized_keys (should block)
2. Skip BUILD step, jump to TEST (should block)
3. Fail VERIFY 3 times (should reset to PLAN)
4. Valid workflow completion (should succeed)

DELIVERABLE: Integration tests pass with mechanical evidence logs.`,
    description: "Guardian+Workflow integration test v2"
  }]
})
```

---

## Test Engineer #2 - AutoDebug + DualBrain v2-IntegrationTest

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `TEST TASK: AutoDebug + DualBrain Integration Testing

TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/

REQUIREMENTS:
1. Test AutoDebug pattern-based error fixing
2. Verify DualBrain mode switching (Micro/Macro ↔ Plan/Build)
3. Test AutoDebug integration with error pipeline
4. Verify DualBrain auto-switch on task analysis
5. Cross-module validation (AutoDebug ↔ DualBrain)
6. Test error pattern loading (47+ patterns)
7. Create test logs with mechanical evidence

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-3, @engineer-4, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Messages use ONLY tokens needed

TEST SCENARIOS:
1. Trigger Docker error (AutoDebug should detect pattern)
2. Send "build this" prompt (should switch to Micro/Build)
3. Send "analyze architecture" prompt (should switch to Macro/Plan)
4. Test error pattern matching accuracy

DELIVERABLE: Integration tests pass with mechanical evidence logs.`,
    description: "AutoDebug+DualBrain integration test v2"
  }]
})
```

---

## Test Engineer #3 - Nemotron Bridge Validation

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `TEST TASK: Nemotron Communication Layer Validation

TARGET: /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/

REQUIREMENTS:
1. Test message classifier accuracy (2k/4k/6k/8k sizing)
2. Verify compression pipeline effectiveness
3. Test routing to multiple recipients
4. Verify "more context" requests (24-72k tokens)
5. Test minimal token usage (not forced to max budget)
6. Validate metrics tracking
7. Create validation logs with metrics

COMMUNICATION PROTOCOL:
- Test all message types through bridge
- Report compression ratios
- Track token usage accuracy

TEST SCENARIOS:
1. Send "Understood" (should use ~4 tokens, not 2000)
2. Send 10k progress report (should compress to 4k)
3. Request "more context" (should return 24-72k)
4. Send CRITICAL priority (should double limit)
5. Broadcast to all active agents

DELIVERABLE: Validation report with metrics and accuracy scores.`,
    description: "Nemotron bridge validation test"
  }]
})
```

---

**USAGE**: Use test engineers for validation phase before full 5-engineer deployment. Test engineers verify integration points and Nemotron Communication Layer functionality.
