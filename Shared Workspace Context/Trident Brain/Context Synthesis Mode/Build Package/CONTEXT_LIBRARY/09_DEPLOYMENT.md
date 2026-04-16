# Deployment - Context Synthesis Mode

## Environments

- **Development:** Local build, test with synthetic context
- **Staging:** Integration with Trident Brain host
- **Production:** Deployed as Trident Brain plugin

## Build Process

```bash
# 1. TypeScript compilation
npm run build

# 2. Output to dist/
# - index.js
# - modes/context-synthesis/*.js
# - shared/*.js

# 3. Package structure
dist/
├── index.js
├── modes/
│   └── context-synthesis/
└── shared/
```

## Deployment Steps

1. **Build:** `npm run build`
2. **Test:** Run with known context scenarios
3. **Package:** Copy dist to plugin directory
4. **Register:** Add to opencode.json plugins array
5. **Verify:** Call `synthesize_context` trigger