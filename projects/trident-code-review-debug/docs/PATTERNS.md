# TRIDENT BRAIN - DETECTION PATTERNS

## CRITICAL (BANNED - Immediate Fix Required)

### SIMULATED_EXECUTION
```
setTimeout → resolve({success:true})
setTimeout → resolve(true)
Promise.resolve({success:true})
async function { return {success:true} }
setTimeout.*100ms
```

### THEATRICAL_CODE
```
TODO.*full.*implementation
TODO.*real
in v\d+.*we just return
Full implementation would
mock data
fake
simulate
theatrical
```

### STUB_CODE
```
function.*return null
function.*return undefined
=> null
=> undefined
async function.*\{\s*\}
```

### SQL_INJECTION
```
`${...}` in query/select/insert
string.format.*query
"+variable+" in query
```

### SECRET_EXPOSURE
```
api_key = "20+ chars"
secret = "20+ chars"
password = "20+ chars"
sk-[a-zA-Z0-9]{32,}
ghp_[a-zA-Z0-9]{36,}
```

### AUTH_BYPASS
```
if(true){return true}
always = true
bypass = true
skipAuth = true
```

---

## HIGH

### XSS
```
innerHTML =
dangerouslySetInnerHTML
document.write
```

### EMPTY_CATCH
```
catch(e){}
catch(e){/* empty */}
```

### HOOK_SPILLOVER
```
isAgent() === false
if(!agent){
agent === undefined
_currentPhase
```

---

## MEDIUM

### GLOBAL_STATE
```
^global\.
^globalThis\.
^(let|const|var) _\w+
```

### COMPLEXITY
```
10+ if statements in 100+ lines
5+ for loops
3+ while loops
```

### RESOURCE_LEAK
```
addEventListener without removeEventListener
setInterval without clearInterval
```

---

## PATTERN COUNTS

| Category | Count | Severity |
|----------|-------|----------|
| SIMULATED_EXECUTION | 12 | CRITICAL |
| THEATRICAL_CODE | 11 | CRITICAL |
| STUB_CODE | 7 | CRITICAL |
| SQL_INJECTION | 4 | CRITICAL |
| SECRET_EXPOSURE | 7 | CRITICAL |
| AUTH_BYPASS | 6 | CRITICAL |
| XSS | 4 | HIGH |
| EMPTY_CATCH | 2 | HIGH |
| HOOK_SPILLOVER | 5 | HIGH |
| GLOBAL_STATE | 3 | MEDIUM |
| COMPLEXITY | 3 | MEDIUM |
| RESOURCE_LEAK | 2 | MEDIUM |

**TOTAL: 66 patterns**

---

*Full regex definitions in src/algorithmic-core.ts - PATTERNS constant*
