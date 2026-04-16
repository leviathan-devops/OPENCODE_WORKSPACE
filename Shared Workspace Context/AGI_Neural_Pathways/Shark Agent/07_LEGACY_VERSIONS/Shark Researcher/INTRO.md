# SHARK RESEARCHER — Automated Research Intelligence System
## An OpenCode Plugin / Hermes Skill that builds subject-matter expertise from primary sources

**Date**: 2026-04-02
**Status**: Design synthesis — ready to implement
**Version**: 0.1.0

---

## Quick Orientation

This is the **build context library** for the Shark Researcher — an automated research intelligence system that monitors primary sources (X/Twitter, Substack, GitHub, Telegram, YouTube, blogs, arXiv) and incrementally builds subject-matter expertise on user-defined topics.

---

## What Is Shark Researcher?

Shark Researcher is a multi-pipeline research system that:
- **Ingests** from 8+ source types at configurable velocities
- **Processes** raw content through dedup, extraction, embedding
- **Stores** in a local vector knowledge store with rich metadata
- **Synthesizes** periodic summaries that compound over time
- **Detects** contradictions, trends, and emerging voices
- **Delivers** on-demand answers and scheduled digests

It becomes a subject-matter expert through accumulation, source-weighting, and periodic re-synthesis.

---

## What Is This Library?

This library contains everything needed to build Shark Researcher from scratch:

```
Shark Researcher/
├── BUILD/                 ← Implementation workspace
├── REFERENCES/            ← SPECS and design decisions (ground truth)
├── SOURCES_DECODED/       ← Source API patterns and quirks
├── INGESTION_STRATEGIES/  ← Source-specific ingestion recipes
├── TECHNIQUES/            ← Processing, extraction, synthesis patterns
├── CAPABILITIES/          ← Source type capabilities and limits
├── PIPELINES/             ← Pipeline specifications
├── RESEARCH_AGENTS/       ← Agent definitions for research roles
└── PERSPECTIVES/          ← Context from other research systems
```

---

## Start Here

Read these files in order:

1. **`BUILD/SHARK_START_HERE.md`** — Step-by-step implementation plan
2. **`PIPELINES/PIPELINE_SPEC.md`** — Full pipeline architecture
3. **`REFERENCES/ARCHITECTURE.md`** — Detailed system design

---

## Key Constraints

1. **Store raw content** — never just summaries. Re-process with better prompts later.
2. **Dedup before store** — URL hash + content fingerprint prevents duplicates
3. **Weight sources** — track accuracy over time, weight accordingly
4. **Contradiction detection** — this is the killer feature, not optional
5. **Zero-infra default** — sqlite-vec, local embeddings, can upgrade to Qdrant

---

## Source Types (8)

| Source | Access Pattern | Velocity | Difficulty |
|--------|---------------|----------|------------|
| RSS/Blogs (Substack, WordPress) | RSS ATOM feeds | Low-Med | Easy |
| X/Twitter | RSS bridge or API | High | Hard |
| GitHub | REST/GraphQL + Release RSS | Med | Easy |
| Telegram | Telethon (MTProto) or public scrape | High | Medium |
| YouTube | RSS + transcript extraction | Low | Easy |
| arXiv | HTTP API | Medium | Easy |
| Hacker News | Official API/Algolia | Med | Easy |
| Discord | Bot listener or webhook bridge | High | Medium |

---

## Architecture at a Glance

```
┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│   SOURCES   │──▶│  INGESTION  │──▶│  PROCESSING  │
│             │   │  Pipeline   │   │  Pipeline    │
│ X/Twitter   │   │             │   │              │
│ Substack    │   │ Poll/Schedule│   │ Dedup        │
│ GitHub      │   │ Rate Limits  │   │ Extract      │
│ Telegram    │   │ Auth/API     │   │ Summarize    │
│ YouTube     │   │ Webhooks     │   │ Embed        │
│ arXiv       │   │              │   │ Tag          │
│ HN/Reddit   │   │              │   │              │
│ Blogs       │   │              │   │              │
└─────────────┘   └─────────────┘   └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ KNOWLEDGE    │
                                    │ STORE        │
                                    │              │
                                    │ sqlite-vec   │
                                    │ or Qdrant    │
                                    │              │
                                    │ Raw content  │
                                    │ Metadata     │
                                    │ Embeddings   │
                                    │ Tags         │
                                    └──────┬───────┘
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                       ┌─────────┐ ┌──────────┐ ┌──────────┐
                       │DELIVERY │ │SYNTHESIS │ │  QUERY   │
                       │         │ │          │ │  (RAG)   │
                       │ Digest  │ │Periodic  │ │ On-demand│
                       │ Realtime│ │Briefings │ │ Answers  │
                       │ Alerts  │ │Contradict│ │ Compare  │
                       └─────────┘ └──────────┘ └──────────┘
```

---

## The "Becoming SME" Feedback Loop

Shark Researcher improves through:

**1. Accumulation** — More sources, broader coverage, richer synthesis
**2. Source Weighting** — Track which sources proved accurate, weight higher
**3. Topic Refinement** — Auto-discover sub-topics and new key people
**4. Re-Processing** — Better embeddings/prompts retroactively improve all data
**5. Contradiction Detection** — Flag disagreements, the most valuable expert output
**6. Trend Tracking** — Not just "what happened" but "how thinking evolved"

---

## Verification Tests

After implementation, verify:

1. **Dedup**: Same article from 2 sources stored only once
2. **Velocity**: High-velocity sources polled at correct intervals
3. **Embedding**: Similar content clusters in vector space
4. **Synthesis**: Weekly briefing captures evolution, not just list of items
5. **Contradiction Detection**: System flags when Source A and Source B disagree
6. **Query**: "What's the latest on X?" returns relevant, summarized results
7. **Source Audit**: Dead sources detected after 30 days of silence
8. **Re-embed**: Can swap embedding model without data loss

---

## Tech Stack

```
Ingestion:    Python (feedparser, requests, Telethon, GitHub.py, aiohttp)
Processing:   LLM (summarization), sentence-transformers (embeddings)
Storage:      sqlite-vec (default) or Qdrant Cloud
Scheduling:   Cron or Hermes cronjob tool
Delivery:     Markdown digests, Discord/Telegram webhook, CLI queries
```

---

## Dependencies

```bash
# Core
pip install feedparser requests aiohttp
pip install sentence-transformers sqlite-vec

# Optional sources
pip install Telethon                    # Telegram
pip install PyGithub                    # GitHub
pip install youtube-transcript-api      # YouTube transcripts
pip install praw                        # Reddit

# Storage alternatives
pip install qdrant-client               # If using Qdrant
```

---

## Where to Get Help

| Problem | Resource |
|---------|----------|
| Source not returning data | `SOURCES_DECODED/` — check auth and rate limits |
| Duplicates appearing | `TECHNIQUES/DEDUP.md` — check fingerprint function |
| Vector search poor results | `TECHNIQUES/EMBEDDING.md` — check chunk strategy |
| Synthesis shallow | `TECHNIQUES/SYNTHESIS.md` — review prompt templates |
| Source dead/degraded | `BUILD/SOURCE_AUDIT.md` — run monthly audit |
