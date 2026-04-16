# INGESTION STRATEGIES — How to Build This

**Date**: 2026-04-02

---

## Strategy 1: Python Scripts + Cron (Recommended)

Most straightforward. Each source type has its own extractor module:

```
scripts/
  ingest.py              # Main orchestrator
  extractors/
    __init__.py
    rss_extractor.py     # feedparser
    github_extractor.py  # PyGithub + REST
    telegram_extractor.py  # Telethon
    youtube_extractor.py # youtube-transcript-api
    arxiv_extractor.py   # HTTP API
    hn_extractor.py      # Algolia API
  processors/
    __init__.py
    dedup.py             # URL hash + content fingerprint
    llm_extractor.py     # LLM summary/claims/entities
    chunker.py           # Content chunking
    embedder.py          # Embedding generation
    contradiction.py     # Contradiction detection
  synthesizers/
    __init__.py
    daily_digest.py
    weekly_synthesis.py
    monthly_retrospective.py
  storage/
    __init__.py
    sqlite_vec_store.py  # SQLite + sqlite-vec
    qdrant_store.py      # Qdrant client
```

---

## Strategy 2: Hermes Cron Jobs

Use Hermes's built-in cronjob tool + Python scripts:

- Each cron job calls a script with specific parameters
- No separate scheduler needed
- Delivery via Hermes (Discord/Telegram/CLI)
- Cron job results appear in chat

```
cronjob create:
  schedule: every 2h
  prompt: "Run: python ingest.py --velocity high --all-topics"

cronjob create:
  schedule: 0 9 * * *
  prompt: "Run: python query.py --mode digest --topic all"
```

---

## Strategy 3: Agent-Based Research (Future Enhancement)

Use the Hermes agent itself as a researcher:

```
hermes -s shark-researcher --query "What's new on X this week?"
```

- Agent reads from knowledge store
- Supplements with live queries
- Produces analysis on demand
- Updates knowledge store with find ings

---

## Recommended Build Order

1. Phase 0: Foundation (DB + config + base scripts) — Day 1-2
2. Phase 1: Ingestion (RSS + GitHub + arXiv) — Day 3-5
3. Phase 2: Processing (dedup + LLM + embeddings) — Day 6-8
4. Phase 3: Synthesis (digests + RAG queries) — Day 9-11
5. Phase 4: Advanced sources (X + Telegram + YouTube) — Day 12-14
6. Phase 5: Self-improvement (source weights, auto-discovery) — Day 15+
