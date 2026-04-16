#!/bin/bash
# Hive Mind Plugin v4 - Integration Test Suite

OPENVIKING_URL="http://localhost:1933"
EMBEDDING_URL="http://localhost:8001"
API_KEY="e01182bc96ec5dbf254bf4ac862747f535eb329c420f98da47a54e91f2d696f6"

echo "========================================"
echo "Hive Mind Plugin - Integration Tests"
echo "========================================"

# Test 1: Health
echo -n "Test 1: Health check... "
HEALTH=$(curl -s "$OPENVIKING_URL/health")
if echo "$HEALTH" | grep -q '"healthy":true'; then
    echo "PASS"
else
    echo "FAIL"
fi

# Test 2: Embedding
echo -n "Test 2: Embedding (768-dim)... "
EMBED=$(curl -s -X POST "$EMBEDDING_URL/v1/embeddings" \
    -H "Content-Type: application/json" \
    -d '{"model":"nomic-embed-text-v1.5.Q4_K_M.gguf","input":"hello world test"}')
DIM=$(echo "$EMBED" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data'][0]['embedding']))" 2>/dev/null)
[ "$DIM" = "768" ] && echo "PASS (dim=$DIM)" || echo "FAIL (dim=$DIM)"

# Test 3: Temp Upload
echo -n "Test 3: Temp upload... "
TEMP=$(curl -s -X POST "$OPENVIKING_URL/api/v1/resources/temp_upload" \
    -H "X-API-Key: $API_KEY" \
    -H "X-OpenViking-Account: default" \
    -H "X-OpenViking-User: test" \
    -F "file=@/dev/stdin;filename=test.md" <<< "test content")
echo "$TEMP" | grep -q "temp_path" && echo "PASS" || echo "FAIL"

# Test 4: Commit
# NOTE: OpenViking's wait:true hangs due to queue processing bug
# Use wait:false (async) - the plugin uses this mode
echo -n "Test 4: Commit (async)... "
TEMP_PATH=$(echo "$TEMP" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['temp_path'])" 2>/dev/null)
COMMIT=$(curl -s -X POST "$OPENVIKING_URL/api/v1/resources" \
    -H "X-API-Key: $API_KEY" \
    -H "X-OpenViking-Account: default" \
    -H "X-OpenViking-User: test" \
    -H "Content-Type: application/json" \
    -d "{\"temp_path\":\"$TEMP_PATH\",\"to\":\"viking://resources/hive-mind/shared/test/test.md\",\"reason\":\"test\",\"wait\":false}")
echo "$COMMIT" | grep -q '"status":"ok"' && echo "PASS" || echo "FAIL"

# Test 5: Search
echo -n "Test 5: Semantic search... "
SEARCH=$(curl -s -X POST "$OPENVIKING_URL/api/v1/search/find" \
    -H "X-API-Key: $API_KEY" \
    -H "X-OpenViking-Account: default" \
    -H "X-OpenViking-User: test" \
    -H "Content-Type: application/json" \
    -d '{"query":"test","target_uri":"viking://resources/hive-mind/shared/test/","limit":5}')
COUNT=$(echo "$SEARCH" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('resources',[])))" 2>/dev/null)
[ "$COUNT" -gt 0 ] && echo "PASS (found=$COUNT)" || echo "FAIL (found=$COUNT)"

# Test 6: Fetch
echo -n "Test 6: Fetch by URI... "
FETCH=$(curl -s "$OPENVIKING_URL/api/v1/content/overview?uri=viking://resources/hive-mind/shared/test/test.md" \
    -H "X-API-Key: $API_KEY" \
    -H "X-OpenViking-Account: default" \
    -H "X-OpenViking-User: test")
echo "$FETCH" | grep -q '"result"' && echo "PASS" || echo "FAIL"

# Test 7: Local Fallback
echo -n "Test 7: Local fallback... "
LOCAL_DIR="/home/leviathan/.local/share/opencode/hive-mind"
[ -d "$LOCAL_DIR" ] && echo "PASS (dir exists)" || echo "FAIL (dir missing)"

echo "========================================"
echo "Done"