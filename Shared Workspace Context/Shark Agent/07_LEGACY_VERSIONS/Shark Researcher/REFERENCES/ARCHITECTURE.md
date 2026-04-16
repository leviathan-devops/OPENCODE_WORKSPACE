# SHARK RESEARCHER — Definitive Architecture
## Design Specification for Automated Research Intelligence

**Date**: 2026-04-02
**Status**: Design synthesis — ready to implement

---

## System Overview

Shark Researcher operates on three concurrent loops with different time horizons:

```
FAST LOOP (minutes-hours):  Ingestion → Dedup → Store
MEDIUM LOOP (hour-day):     Process → Extract → Embed
SLOW LOOP (day-week-month): Synthesize → Deliver → Learn
```

Each loop is independent. If the slow loop fails (LLM API down), fast/medium continue. Raw data accumulates and processing catches up when capacity returns.

---

## Architecture Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SHARK RESEARCHER SYSTEM                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ CONFIG LAYER                                                │     │
│  │                                                             │     │
│  │  topics.yaml:       Topic definitions, keywords, cadence    │     │
│  │  sources.yaml:      Source registry (8 types)               │     │
│  │  storage.yaml:      DB backend, embedding model             │     │
│  │                                                             │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                    │                                                  │
│                    ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ INGESTION LAYER (FAST LOOP: 1h-12h cadence)                 │     │
│  │                                                             │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │     │
│  │  │ RSS/    │  │ X/      │  │ GitHub  │  │ Telegram│       │     │
│  │  │ Blog    │  │ Twitter │  │         │  │         │       │     │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │     │
│  │  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐       │     │
│  │  │ YouTube │  │ arXiv   │  │ HN/     │  │ Discord │       │     │
│  │  │ Channel │  │ Papers  │  │ Reddit  │  │ Channels│       │     │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │     │
│  │       │            │           │            │              │     │
│  │       ▼            ▼           ▼            ▼              │     │
│  │  ┌───────────────────────────────────────────────────┐     │     │
│  │  │ INGESTION DISPATCHER                               │     │     │
│  │  │ • Routes to correct extractor by type              │     │     │
│  │  │ • Enforces rate limits per source                  │     │     │
│  │  │ • Handles auth/API keys                            │     │     │
│  │  │ • Returns: RawItem(url, title, content, meta)     │     │     │
│  │  └───────────────────────────────────────────────────┘     │     │
│  └───────────────────────────────┬─────────────────────────────┘     │
│                                  │                                    │
│                                  ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ PROCESSING LAYER (MEDIUM LOOP: per-item, triggered)         │     │
│  │                                                             │     │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐          │     │
│  │  │ DEDUP      │──▶│ EXTRACT    │──▶│ EMBED      │          │     │
│  │  │            │   │            │   │            │          │     │
│  │  │ URL hash   │   │ LLM call:  │   │ Chunk      │          │     │
│  │  │ Content    │   │ - Summary  │   │ Embed      │          │     │
│  │  │ fingerprint│   │ - Claims   │   │ Store vec  │          │     │
│  │  │ Cross-src  │   │ - Entities │   │            │          │     │
│  │  │ filter     │   │ - Tags     │   │            │          │     │
│  │  │            │   │ - Score    │   │            │          │     │
│  │  └────────────┘   └────────────┘   └────────────┘          │     │
│  │       │                                   │                 │     │
│  │       ▼                                   ▼                 │     │
│  │  ┌─────────────────────────────────────────────┐            │     │
│  │  │ CONTRADICTION DETECTOR                       │            │     │
│  │  │ • Similar claims, opposing content           │            │     │
│  │  │ • LLM judgment on contradiction              │            │     │
│  │  │ • Store: pair, type, explanation             │            │     │
│  │  └─────────────────────────────────────────────┘            │     │
│  └───────────────────────────────┬─────────────────────────────┘     │
│                                  │                                    │
│                                  ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ KNOWLEDGE STORE (Persistent, Queryable)                     │     │
│  │                                                             │     │
│  │  Backend: sqlite-vec (default) or Qdrant                    │     │
│  │                                                             │     │
│  │  Tables:                                                     │     │
│  │    items          Raw content + metadata                    │     │
│  │    embeddings     Chunk vectors (FAISS-indexed)              │     │
│  │    sources        Source registry + health metrics           │     │
│  │    syntheses      Periodic synthesis artifacts              │     │
│  │    contradictions Pairs of conflicting claims               │     │
│  │    source_scores  Per-source accuracy over time             │     │
│  │                                                             │     │
│  │  Each item has:                                              │     │
│  │    id, url, source_id, topic, title, body_text,              │     │
│  │    raw_content, summary, key_claims[], entities[],           │     │
│  │    tags[], relevance_score, ingested_at, processed_at         │     │
│  └───────────────────────────────────────┬─────────────────────┘     │
│                                          │                            │
│                                          ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ SYNTHESIS LAYER (SLOW LOOP: daily-week-month)               │     │
│  │                                                             │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │     │
│  │  │ DAILY      │  │ WEEKLY     │  │ MONTHLY    │             │     │
│  │  │ DIGEST     │  │ SYNTHESIS  │  │ RETROSPECT │             │     │
│  │  │            │  │            │  │            │             │     │
│  │  │ New items  │  │ + Trends   │  │ + Forecasts│             │     │
│  │  │ + Top 5    │  │ + Consensus│  │ + Key ppl  │             │     │
│  │  │ + Quick    │  │ + Debates  │  │ + Score    │             │     │
│  │  │            │  │ + Contradict│  │ + Sources  │             │     │
│  │  └────────────┘  └────────────┘  └────────────┘             │     │
│  │                                                             │     │
│  │  ┌─────────────────────────────────────────────────────┐   │     │
│  │  │ RAG QUERY ENGINE                                     │   │     │
│  │  │                                                      │   │     │
│  │  │  Modes: question, recent, synthesis,                  │   │     │
│  │  │  contradictions, timeline                             │   │     │
│  │  │                                                      │   │     │
│  │  │  Flow:                                                │   │     │
│  │  │  1. Embed user query                                  │   │     │
│  │  │  2. Top-K retrieval from vector store                 │   │     │
│  │  │  3. LLM synthesis with source citations               │   │     │
│  │  │  4. Return structured answer                          │   │     │
│  │  └─────────────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│                    │                                                 │
│                    ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ DELIVERY LAYER                                              │     │
│  │                                                             │     │
│  │  Real-time:  Webhook → Discord/Telegram/Slack               │     │
│  │  Digest:     Daily/weekly markdown files                    │     │
│  │  On-demand:  CLI query interface                            │     │
│  │  Archive:    Versioned syntheses in git                     │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Single Item Lifecycle

```
1. SOURCE emits new item
       │
2. INGEST fetches raw content (text, title, metadata)
       │
3. DEDUP checks:
   - Has this URL been seen? → skip if yes
   - Does content fingerprint match existing? → skip if yes
   - Is relevance below threshold? → drop if yes
       │  (passes)
4. RAW STORE: Save raw content as immutable record
       │
5. LLM EXTRACTION:
   - Generate 3-5 sentence summary
   - Extract key claims (structured)
   - Identify entities (people, tools, papers)
   - Assign topic tags
   - Score relevance (0-1)
       │
6. CHUNK + EMBED:
   - Split into chunks (500 tokens, 50 overlap)
   - Embed each chunk with model
   - Store vectors in embeddings table
       │
7. CONTRADICTION SCAN:
   - Find similar claims from prior items
   - LLM judgment: contradict or not?
   - If yes, store contradiction record
       │
8. SOURCE SCORE UPDATE:
   - Increment item count
   - If used in synthesis, increment usage count
   - Recalculate weight
       │
9. READY FOR QUERY
```

---

## Storage Schema

```sql
-- Core items table
CREATE TABLE items (
    id TEXT PRIMARY KEY,                    -- UUID
    url TEXT NOT NULL,
    content_hash TEXT NOT NULL,             -- sha256 of content for dedup
    source_id TEXT NOT NULL REFERENCES sources(id),
    topic TEXT NOT NULL,
    title TEXT,
    body_text TEXT,
    raw_content TEXT,                       -- full original content
    summary TEXT,                           -- LLM-generated
    key_claims TEXT,                        -- JSON array of claims
    entities TEXT,                          -- JSON: {people: [], tools: [], papers: [], repos: []}
    tags TEXT,                              -- JSON array
    relevance_score REAL DEFAULT 0.5,       -- 0-1, against topic keywords
    ingested_at TEXT,                       -- ISO 8601
    processed_at TEXT,                      -- ISO 8601
    author TEXT,
    published_at TEXT
);

CREATE TABLE embeddings (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    chunk_index INTEGER,
    text_chunk TEXT,
    embedding BLOB,                         -- vector as BLOB
    embedding_model TEXT                    -- model used, for re-embedding
);

CREATE INDEX idx_embeddings_item ON embeddings(item_id);
CREATE INDEX idx_items_topic ON items(topic);
CREATE INDEX idx_items_source ON items(source_id);
CREATE INDEX idx_items_relevance ON items(relevance_score);

-- Source management
CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                     -- rss, x_twitter, github_repo, telegram, youtube, arxiv, hn, discord
    url TEXT,
    channel TEXT,
    owner TEXT,
    repo TEXT,
    topic TEXT NOT NULL,
    velocity TEXT DEFAULT 'medium',         -- high, medium, low
    weight REAL DEFAULT 0.7,                -- 0-1, source reliability
    last_ingested TEXT,
    items_count INTEGER DEFAULT 0,
    items_used_count INTEGER DEFAULT 0,     -- used in synthesis
    status TEXT DEFAULT 'active',           -- active, degraded, dead
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    config TEXT                             -- JSON for type-specific config
);

-- Periodic syntheses
CREATE TABLE syntheses (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    window_start TEXT,
    window_end TEXT,
    synthesis_type TEXT,                    -- daily, weekly, monthly
    content TEXT,                           -- markdown synthesis
    key_developments TEXT,                  -- JSON array
    new_entities TEXT,                      -- JSON array
    contradictions TEXT,                    -- JSON array
    created_at TEXT
);

-- Contradiction tracking
CREATE TABLE contradictions (
    id TEXT PRIMARY KEY,
    item_a_id TEXT REFERENCES items(id),
    item_b_id TEXT REFERENCES items(id),
    claim_a TEXT,
    claim_b TEXT,
    contradiction_type TEXT,                -- factual, methodological, interpretive, temporal
    explanation TEXT,
    detected_at TEXT,
    resolved INTEGER DEFAULT 0
);

-- Source quality tracking
CREATE TABLE source_scores (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id),
    period_start TEXT,
    period_end TEXT,
    items_ingested INTEGER,
    items_relevant INTEGER,                  -- relevance_score > 0.5
    items_used_in_synthesis INTEGER,
    accuracy_score REAL,                     -- derived from synthesis usage
    average_relevance REAL
);
```

---

## Source Weight Evolution

Source weights start at manual defaults and evolve:

```
weight_new = base_weight                              # Initial config

weight_monthly = (
    items_used_in_synthesis / items_relevant * 0.4  +  # Did it contribute?
    average_relevance * 0.3                           +  # Was it on-topic?
    (1 - error_rate) * 0.2                            +  # Is it reliable?
    novelty_score * 0.1                                  # Does it add new info?
)

weight_next = weight_current * 0.7 + weight_monthly * 0.3  # Smoothed

If status='dead' (0 items/30d): weight = 0.0, status='dead'
If error_rate > 0.5: status='degraded', halve weight
If avg relevance < 0.3: weight *= 0.8
```

---

## Chunking Strategy

| Content Size | Strategy | Chunks |
|-------------|----------|--------|
| < 500 tokens (tweets, short posts) | Single chunk, whole item | 1 |
| 500-2000 tokens (blog posts, GitHub discussions) | Split by section/heading | 2-6 |
| 2000-8000 tokens (long articles, papers) | Split by section, then 500-token sub-chunks | 6-20 |
| 8000+ tokens (papers, book chapters) | Split by section, 500-token chunks, 50 overlap | 20-50 |

Chunk metadata includes: item_id, chunk_index, chunk_type (full/section/subsection), section_title, full_tokens_this_item.

---

## Synthesis Prompt Design

### Daily Digest Prompt
```
You are a research analyst tracking developments in {topic_name}.

Below are the {N} most relevant items ingested in the last 24 hours.
Source reliability weights are included.

TOPIC: {topic_name}  |  DESCRIPTION: {topic_description}
DATE: {date}
KEYWORDS: {seed_keywords}

ITEMS:
{items_block}  # title, summary, source(weight), author, date, tags

Instructions:
1. Write a tight briefing of the top 5 developments
2. For each: what changed, why it matters, link to source
3. Note any contradictions or disagreements
4. Highlight any new entities (people/tools/papers) that appeared

Format as a structured markdown report.
Keep it under 800 words.
```

### Weekly Synthesis Prompt
```
You are a senior research analyst who has been tracking {topic_name} for 6 months.

Below are this week's items and prior syntheses.

Your task:
1. What shifted this week vs last week?
2. What is the current consensus on the top 3 debates?
3. What contradictions emerged?
4. Who are the new voices this week?
5. If someone asked "what's happening with {topic_name}?", what's your answer?

Use evidence from the items. Cite sources. Track evolution.
```

### Monthly Retrospective Prompt
```
You are a domain expert in {topic_name} writing a comprehensive monthly review.

Below are all weekly syntheses and key items from the month.

Your task:
1. What were the 3-5 major developments this month?
2. How did thinking/consensus evolve?
3. Which predictions from last month's retrospective were right/wrong?
4. Which sources proved most valuable? Which declined?
5. What should we watch for next month?
6. Recommend 2-3 new sources to follow based on entities mentioned.

This is a living document that compounds over time.
```

---

## RAG Query Flow

```
User asks: "{question}"

1. Embed question with same model as knowledge store
2. Query embeddings: top 50 chunks by cosine similarity
3. Group by source_id, keep top 5 per source
4. For each group, get full item (summary + key_claims + entities)
5. LLM prompt:

"You are a research expert on {topic_name}. Answer this question:

{question}

Here is relevant context from {N} sources:
{context_block}  # summary, source(weight), date, key_claims

Instructions:
- Answer directly with citations [source_id]
- Note disagreements between sources
- Distinguish facts from opinions
- If unsure, say so
"

6. Return: structured answer with source links
```

---

## Key Design Decisions

1. **Raw content is immutable** — Never overwrite raw_content. Summary/extraction can be re-done, but raw stays.

2. **Store summaries at ingestion time** — Don't re-summarize on query. It's expensive and summaries accumulate.

3. **Embedding model in schema** — Track which model embedded each chunk. Enables selective re-embedding.

4. **Contradictions are first-class** — Not an afterthought. This is how the system becomes a real expert.

5. **Source weights compound** — Good sources get read more in synthesis. Bad sources fade. No need for manual curation after initial setup.

6. **No hard dependencies between loops** — If LLM is down, ingestion continues. If DB is down, queue raw items. Each loop is crash-tolerant.

7. **SQLite default, Qdrant optional** — sqlite-vec supports vector search without any infrastructure. Qdrant for team/multi-user.

8. **Git-versioned syntheses** — Store synthesis outputs in git. They become a research archive you can browse and diff.
