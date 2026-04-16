# Deployment - Problem Solving Mode

## Environments

- **Development:** Local build, test with known problems
- **Staging:** Integration with Trident Brain host
- **Production:** Deployed as Trident Brain plugin

## Build Process

```bash
# 1. TypeScript compilation
npm run build

# 2. Output to dist/
# - index.js
# - modes/problem-solving/*.js
# - shared/*.js

# 3. Package structure
dist/
├── index.js
├── modes/
│   └── problem-solving/
└── shared/
```

## Deployment Steps

1. **Build:** `npm run build`
2. **Test:** Run against known debugging problems
3. **Package:** Copy dist to plugin directory
4. **Register:** Add to opencode.json plugins array
5. **Verify:** Call `/trident solve <problem>` trigger

## Plugin Registration

```json
{
  "plugins": [
    "file:///path/to/trident-brain/dist/index.js"
  ]
}
```