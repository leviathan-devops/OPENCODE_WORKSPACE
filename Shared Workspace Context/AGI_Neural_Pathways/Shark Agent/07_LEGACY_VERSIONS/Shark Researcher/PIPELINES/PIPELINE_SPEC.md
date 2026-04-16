# PIPELINE SPEC — Shark Researcher Data Flow
## End-to-end pipeline for each loop

**Date**: 2026-04-02

---

## Pipeline 1: Ingestion (Triggered on Schedule)

```
INPUT:  sources.yaml (filtered by velocity + topic)
OUTPUT: list of RawItem objects in /data/raw/
SIDE EFFECT: Updates sources.last_ingested, sources.items_count
```

### Steps

```
for each source in sources:
    1. Check last_ingested timestamp
    2. If now - last_ingested < min_interval(source.velocity): skip
    3. Call extractor for source.type
    4. Extractor returns: [(title, content, author, date, url, meta)]
    5. For each item:
        a. Compute content_hash = sha256(url + content[:1000])
        b. If content_hash in seen_hashes: skip
        c. Save to /data/raw/{source.id}/{content_hash}.json
        d. sources.items_count += 1
    6. sources.last_ingested = now
    7. sources.error_count = 0 (on success) or += 1 (on failure)
    8. If error_count > 3: sources.status = 'degraded'
```

### Velocity Configuration

| Velocity | Min Interval | Max Batch |
|----------|-------------|-----------|
| high | 1 hour | 50 items |
| medium | 6 hours | 200 items |
| low | 24 hours | 500 items |

### Extractor Registry

```python
EXTRACTORS = {
    'rss': extract_rss,              # feedparser
    'github_repo': extract_github,   # PyGithub + requests
    'telegram': extract_telegram,    # Telethon or web scrape
    'youtube': extract_youtube,      # youtube-transcript-api
    'arxiv': extract_arxiv,          # requests to arXiv API
    'hn': extract_hackernews,        # Algolia API
    'discord': extract_discord,      # Bot or webhook
}
```

---

## Pipeline 2: Processing (Triggered by New Raw Items)

```
INPUT:  /data/raw/ — unprocessed items
OUTPUT: ProcessedItem in knowledge.db
SIDE EFFECT: Populates embeddings table, contradictions table
```

### Steps

```
for each raw_item in /data/raw/:
    1. Check if item_id already in items table → skip if yes
    2. DEDUP: Check content_hash → skip if match
    3. RELEVANCE FILTER:
        - Score against topic keywords
        - If score < 0.2: archive but don't process
    4. LLM EXTRACTION (for items with score > 0.2):
        - Send: raw_content + topic context
        - Receive: summary, claims[], entities[], relevance_score
    5. CHUNK + EMBED:
        - Split into chunks per chunking strategy
        - Embed each chunk
        - Store in embeddings table
    6. CONTRADICTION SCAN:
        - For each claim in new item:
            - Find similar claims from prior items (embedding similarity > 0.7)
            - LLM check: "Do these contradict?"
            - If yes: store contradiction record
    7. WRITE TO DB:
        - items table: full record
        - embeddings table: chunk vectors
        - sources.items_used_count += 1 (if used in contradiction)
    8. Mark raw item as processed (move to /data/processed/)
```

### LLM Extraction Prompt

```
You are a research analyst. Analyze this document for the topic: {topic_name}

TOPIC: {topic_name}
DESCRIPTION: {topic_description}
KEYWORDS: {seed_keywords}

DOCUMENT:
Title: {title}
Author: {author}
Date: {date}
URL: {url}
Content: {content}

Respond with JSON:
{
  "summary": "3-5 sentence summary of the key points",
  "key_claims": ["claim 1", "claim 2", ...],
  "entities": {
    "people": ["name 1", ...],
    "tools": ["tool 1", ...],
    "papers": ["paper title 1", ...],
    "repos": ["owner/repo 1", ...]
  },
  "tags": ["tag 1", ...],
  "relevance_score": 0.7
}

Rules:
- Summary must capture what changed, not just what exists
- Claims must be specific enough to check against others
- Entities should only include entities relevant to the topic
- Relevance is 0-1 based on importance to {topic_name}
"
```

---

## Pipeline 3: Synthesis (Scheduled: Daily/Weekly/Monthly)

```
INPUT:  items from last N days/weeks/months
OUTPUT: Synthesis artifact in /data/syntheses/ + syntheses table
```

### Daily Digest

```
1. Query items where ingested_at > now - 24h AND relevance_score > 0.5
2. Group by topic
3. For each topic:
    - Sort by relevance_score desc
    - Take top 10
    - Feed to daily digest prompt
    - Save markdown output
4. Deliver: webhook + save to file
```

### Weekly Synthesis

```
1. Query items where ingested_at > now - 7d
2. Plus: last 4 weekly syntheses
3. Plus: last 4 weekly syntheses for trend comparison
4. Feed to weekly synthesis prompt
5. Save markdown + syntheses table entry
6. Update source scores based on usage
```

### Monthly Retrospective

```
1. Query all weekly syntheses from last month
2. Plus: all contradicttions detected this month
3. Plus: source score changes this month
4. Feed to monthly retrospective prompt
5. Save markdown + syntheses table entry
6. Auto-discover new sources from entities
7. Recompute source weights
```

---

## Pipeline 4: RAG Query (On-Demand)

```
INPUT:  User question + topic
OUTPUT: Answer with citations
```

```
1. Embed question
2. Retrieve top 50 chunks (cosine similarity)
3. Deduplicate by item_id (take best chunk per item)
4. Get top 8 items by score
5. For each item: get summary + key_claims + source info
6. LLM prompt: "Answer with these {N} sources as context. Cite [source_id]."
7. Return answer with formatted citations
```

---

## Error Handling

| Failure | Strategy |
|---------|----------|
| Source timeout | Retry 2x with 30s backoff, then mark degraded |
| LLM API error | Queue item, retry on next processing run |
| Embedding model unavailable | Skip embedding, process without, re-embed later |
| DB corruption | Export raw items, recreate DB, re-process |
| Rate limit hit | Back off to 2x interval, resume normal after 1h |
| Content extraction fails | Keep raw, flag for manual review |

