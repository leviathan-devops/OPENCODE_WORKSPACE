# SHARK RESEARCHER — Sprint Plan and Verification

**Date**: 2026-04-02

---

## Sprint 1: Foundation (Day 1-2)

### Acceptance Criteria
- [ ] Knowledge store created with all tables
- [ ] Config system (topics.yaml, sources.yaml) loads without errors
- [ ] ingest.py scaffolds run without errors (empty output OK)
- [ ] query.py returns store status
- [ ] All directories created in ~/.hermes/shark-researcher/

### Deliverables
```
~/.hermes/shark-researcher/
  config/topics.yaml          # 2 example topics
  config/sources.yaml         # 3 example sources
  config/storage.yaml         # sqlite-vec config
  db/knowledge.db             # Created with schema
  scripts/ingest.py           # Skeleton
  scripts/query.py            # Skeleton
  scripts/process.py          # Skeleton
  scripts/synthesize.py       # Skeleton
  scripts/manage_sources.py   # Skeleton
  scripts/extractors/         # Empty __init__.py
  scripts/processors/         # Empty __init__.py
```

---

## Sprint 2: Ingestion — RSS + GitHub + arXiv (Day 3-5)

### Acceptance Criteria
- [ ] RSS extractor returns structured items from 3 test feeds
- [ ] GitHub extractor gets releases from 2 test repos
- [ ] arXiv extractor returns papers for a keyword query
- [ ] All items saved to /data/raw/ as JSON
- [ ] Source last_ingested timestamps updated
- [ ] No duplicates from repeated runs
- [ ] Rate limits respected

### Deliverables
- extractors/rss_extractor.py — working
- extractors/github_extractor.py — working
- extractors/arxiv_extractor.py — working
- ingest.py — routes to correct extractor

---

## Sprint 3: Processing Pipeline (Day 6-8)

### Acceptance Criteria
- [ ] Content hash dedup eliminates 100% of exact duplicates
- [ ] LLM extraction produces valid JSON for 10 test articles
- [ ] Chunking splits articles correctly (verify chunk count)
- [ ] Embeddings generated and stored for 10 test articles
- [ ] Vector similarity search returns relevant results for 5 test queries
- [ ] Contradiction detection flags at least 1 of 3 planted contradictions

### Deliverables
- processors/dedup.py — working
- processors/llm_extractor.py — working
- processors/chunker.py — working
- processors/embedder.py — working
- processors/contradiction.py — working
- storage/sqlite_vec_store.py — working

---

## Sprint 4: Synthesis + RAG (Day 9-11)

### Acceptance Criteria
- [ ] Daily digest generates with 5+ items in topic
- [ ] Weekly synthesis shows narrative, not just list
- [ ] RAG "question" mode returns cited answers for 5 test questions
- [ ] RAG "contradictions" mode finds contradictions
- [ ] Syntheses saved to git-versioned archive
- [ ] Cron jobs scheduled for all cadences

### Deliverables
- synthesizers/daily_digest.py — working
- synthesizers/weekly_synthesis.py — working
- synthesizers/monthly_retrospective.py — working
- query.py --mode question/contradictions/recent/timeline — working

---

## Sprint 5: Advanced Sources + Self-Improvement (Day 12-15)

### Acceptance Criteria
- [ ] X/Twitter ingestion working (via RSS bridge)
- [ ] Telegram ingestion working (public channels)
- [ ] YouTube ingestion with transcripts
- [ ] Source weights recalibrate after 30 days
- [ ] Monthly audit detects 0-item dead sources
- [ ] New source discovery suggests from frequent entities
- [ ] Re-embedding works on all existing chunks

### Deliverables
- extractors/youtube_extractor.py — working
- extractors/telegram_extractor.py — working
- extractors/x_twitter_extractor.py — working
- manage_sources.py --audit --recalibrate --discover — working

---

## Verification Test Suite

```bash
# Run after each sprint
python scripts/verify.py

# Individual tests
python scripts/verify.py --test dedup
python scripts/verify.py --test extraction  
python scripts/verify.py --test embedding
python scripts/verify.py --test contradiction
python scripts/verify.py --test synthesis
python scripts/verify.py --test rag
```
