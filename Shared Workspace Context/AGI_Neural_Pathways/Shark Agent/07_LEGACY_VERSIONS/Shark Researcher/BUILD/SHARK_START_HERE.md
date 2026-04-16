# SHARK RESEARCHER — Build Guide
## Step-by-step implementation, Phase 0 through Phase 3

**Date**: 2026-04-02
**Status**: Ready to implement

---

## Build Overview

Four implementation phases, each independently verifiable:

```
Phase 0 — Foundation        (knowledge store, config, base scripts)
Phase 1 — Ingestion          (RSS, GitHub, arXiv, YouTube)
Phase 2 — Processing         (dedup, LLM extraction, embeddings)
Phase 3 — Synthesis          (digests, periodic briefings, RAG queries)
```

---

## Phase 0: Foundation (Day 1-2)

### Goal
Working knowledge store with config system, empty but ready.

### Steps

1. **Create directory structure**
   ```
   ~/.hermes/shark-researcher/
     config/
       topics.yaml
       sources.yaml
       storage.yaml
     data/
       raw/
       processed/
       syntheses/
     db/
       knowledge.db
     scripts/
       ingest.py
       query.py
       synthesize.py
       manage_sources.py
   ```

2. **Install dependencies**
   ```bash
   cd ~/.hermes/hermes-agent && source venv/bin/activate
   pip install feedparser sentence-transformers sqlite-vec pyyaml requests aiohttp
   ```

3. **Create sqlite-vec knowledge store**
   - Table: `items` — id, url, source_id, topic, title, raw_content, summary, metadata, ingested_at
   - Table: `embeddings` — id, item_id, chunk_index, text_chunk, embedding_vec
   - Table: `sources` — id, type, url, channel, owner, repo, topic, velocity, weight, last_ingested, items_count, status
   - Table: `syntheses` — id, topic, window_start, window_end, content, created_at
   - Table: `source_scores` — id, source_id, period_start, accuracy_score, relevance_score, items_used_in_synthesis

4. **Create config schemas**
   - topics.yaml: topic definitions, keywords, cadence
   - sources.yaml: source definitions with type-specific fields
   - storage.yaml: backend config, embedding model, chunk params

5. **Create base ingest.py skeleton**
   - Reads all sources matching a topic
   - Routes to correct extractor by type
   - Returns list of raw items (url, title, content, metadata)

6. **Create base query.py skeleton**
   - Reads from knowledge store
   - Supports simple text search

### Verification
- `python scripts/query.py --mode test` returns store status
- Config parses without errors
- Empty topics/sources accepted

---

## Phase 1: Ingestion Pipeline (Day 3-5)

### Goal
All source types actively polling and writing raw items to the store.

### Steps

1. **RSS/Blog ingester** (`References/ingestion.md`)
   - feedparser-based
   - Handles RSS and Atom
   - Extracts: title, content, author, date, url, tags
   - Schedule: every 6-12 hours

2. **GitHub ingester**
   - Two modes:
     - Releases: RSS feed (`releases.atom`) — low overhead
     - Full: REST API for discussions, issues, trending — richer
   - Track: releases, discussions, issues
   - Handles pagination
   - Schedule: every 6-12 hours

3. **arXiv ingester**
   - HTTP API: `http://export.arxiv.org/api/query`
   - Categories + keyword query
   - Extracts: title, abstract, authors, date, categories, pdf_url
   - Schedule: daily

4. **YouTube ingester**
   - Channel RSS: `https://www.youtube.com/feeds/videos.xml?channel_id={id}`
   - Pair with transcript extraction (youtube-transcript-api)
   - Extracts: title, transcript, duration, channel, date
   - Schedule: daily

5. **X/Twitter ingester**
   - RSS bridge or Nitter alternative
   - Extracts: tweet text, author, date, url, media_urls
   - Schedule: every 2-4 hours
   - WARNING: Rate limits change frequently, have fallback

6. **Telegram ingester**
   - Public: scrape `t.me/s/{channel}` with requests/BeautifulSoup
   - Private: Telethon (MTProto) with user account
   - Extracts: message text, author, date, url, media
   - Schedule: every 1-2 hours

### Verification
- Each type can be tested independently: `python scripts/ingest.py --source-id <id>`
- Raw items appear in database
- No duplicates from repeated runs (same content, same hash)
- Rate limits respected

---

## Phase 2: Processing Pipeline (Day 6-8)

### Goal
Raw content flows through dedup, extraction, embedding, and storage.

### Steps

1. **Dedup system**
   - URL-based: hash(url) in seen set
   - Content-based: minhash/SimHash for near-duplicates
   - Cross-source: same article shared by X and RSS -> single entry

2. **LLM extraction** (per-item processing)
   For each new item, call LLM with structured prompt:
   - Generate summary (3-5 sentences)
   - Extract key claims/facts (structured)
   - Identify entities: people, tools, papers, repos
   - Assign topic tags (from topic seed keywords)
   - Score relevance to topic (0-1)
   - Store: summary, claims[], entities[], tags, relevance_score

3. **Chunking strategy**
   - Short content (<500 tokens): single chunk
   - Medium (500-2000): split by section/paragraph
   - Long (>2000): split by section, then 500-token chunks with 50 overlap
   - Store: chunks in embeddings table with item_id backref

4. **Embedding**
   - Model: `all-MiniLM-L6-v2` (local, fast) or API
   - Embed each chunk, store in embeddings table
   - Store model name with embeddings (for future re-embedding)

5. **Contradiction detection** (first pass)
   - Compare new key claims against existing claims
   - Use embedding similarity to find relevant prior claims
   - LLM check: "Do these statements contradict? If so, explain."
   - Store contradictions as: item_a_id, item_b_id, claim_a, claim_b, contradiction_type

### Verification
- 100 known articles ingested -> check summary quality
- Duplicates eliminated: 50% reduction vs raw feed
- Embedded content searchable: "DPO vs GRPO" returns relevant chunks
- Contradiction: ingest two opposing takes, system flags the disagreement

---

## Phase 3: Synthesis and Delivery (Day 9-11)

### Goal
Periodic synthesis produces briefings, RAG delivers on-demand answers.

### Steps

1. **Daily digest** (scheduled)
   - Query: new items since last digest, filtered by relevance_score > 0.5
   - Group by topic and source
   - LLM prompt: "Summarize today's developments in {topic}. Top 5 items with context."
   - Output: markdown with sections per topic, linked to source URLs
   - Delivery: push to Discord/Telegram, save to file

2. **Weekly synthesis** (scheduled)
   - Query: all items from past 7 days
   - LLM prompt: "Synthesize this week's developments in {topic}. What changed? What's the current consensus? What's being debated?"
   - Include: trend analysis, contradiction highlights, new entities detected
   - Store: syntheses table, versioned by week
   - Delivery: email, Discord thread, save to knowledge store as document

3. **Monthly retrospective**
   - Query: last 30 days of syntheses + raw items
   - LLM prompt: "What were the major shifts this month? Who emerged as key voices? Which predictions were validated or falsified?"
   - This is where the "SME" behavior compounds

4. **RAG query interface**
   - User question -> embed query -> top K chunks -> LLM synthesis
   - Modes:
     - `question`: Direct answer with citations
     - `recent`: Last N days, top items
     - `synthesis`: Compare perspectives
     - `contradictions`: "What are people disagreeing about?"
     - `timeline`: "How has thinking on X evolved?"

5. **Source quality management**
   - Track per-source: items_in, items_used_in_synthesis, accuracy_score
   - Monthly audit: dead sources (0 items/30d), noisy sources (low used/total ratio)
   - Auto-discovery: extract frequent entities from content, suggest as new sources

### Verification
- Daily digest arrives on schedule with relevant content
- Weekly synthesis shows evolution, not just list
- RAG answers cite sources accurately
- Monthly audit shows source health metrics
- Contradiction report has non-trivial disagreements

---

## Ongoing Maintenance

| Task | Frequency | Script |
|------|-----------|--------|
| Dead source detection | Monthly | manage_sources.py --audit |
| Re-embed with better model | Quarterly | ingest.py --re-embed |
| Topic keyword expansion | As needed | manage_sources.py --discover |
| Source weight adjustment | Monthly | manage_sources.py --recalibrate |
| Contradiction review | Weekly | query.py --contradictions |
| Synthesis archive cleanup | Quarterly | synthesize.py --prune |

---

## Cron Job Setup

```
# High-velocity ingestion (X, Telegram)
every 2h → ingest.py --velocity high

# Medium/low ingestion (RSS, GitHub, arXiv, YouTube)
every 8h → ingest.py --velocity medium --velocity low

# Daily digest
0 9 * * * → query.py --mode digest

# Weekly synthesis
0 10 * * 1 → synthesize.py --weekly

# Monthly audit
0 12 1 * * → manage_sources.py --audit
```
