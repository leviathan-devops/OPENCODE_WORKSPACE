# Deployment - Deep Planning Mode

## Environments

- **Development:** Local build, rapid iteration
- **Staging:** Full integration test
- **Production:** Deployed as Trident Brain plugin

## Build Process

```bash
# 1. TypeScript compilation
npm run build

# 2. Output to dist/
# - index.js
# - modes/planning/*.js
# - shared/*.js

# 3. Package structure
dist/
├── index.js
├── modes/
│   └── planning/
└── shared/
```

## Deployment Steps

1. **Build:** `npm run build`
2. **Test:** Run integration tests
3. **Package:** Copy dist to plugin directory
4. **Register:** Add to opencode.json plugins array
5. **Verify:** Call `/trident plan` trigger

## Plugin Registration

```json
{
  "plugins": [
    "file:///path/to/trident-brain/dist/index.js"
  ]
}
```

## Verification

After deployment:
1. Trigger: `/trident plan <task>`
2. Check: Output is injectable markdown
3. Verify: Other agents can use output