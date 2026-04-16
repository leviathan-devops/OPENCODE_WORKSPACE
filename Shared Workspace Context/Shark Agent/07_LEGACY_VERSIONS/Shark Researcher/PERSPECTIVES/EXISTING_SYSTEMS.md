# EXISTING RESEARCH SYSTEMS — What to Learn From
## Analysis of existing research tools and what they do well/poorly

**Date**: 2026-04-02

---

## Blogwatcher (CLI RSS Monitor)

**What it does**: Monitors RSS/Atom feeds, detects new posts, notifies
**What it does well**: Reliable, lightweight, handles many sources, no cloud needed
**What it lacks**: No content extraction, no synthesis, no knowledge accumulation
**What we steal**: RSS monitoring pattern, feed normalization

---

## RSS-Bridge / RSSTHub

**What it does**: Converts non-RSS sources to RSS feeds
**What it does well**: Enables monitoring of platforms without native RSS
**What it lacks**: No content analysis, just format conversion
**What we steal**: The concept — convert everything to a common ingest format

---

## Readwise / Reader

**What it does**: Saves highlights from various sources, spaced repetition review
**What it does well**: Cross-source saving, good UI, integration with note apps
**What it lacks**: No automated synthesis, manual curation required
**What we steal**: Cross-source save pattern, tagging system

---

## Memex / Hypothesis

**What it does**: Web annotation, cross-page search, knowledge management
**What it does well**: Page-level annotation, search across all annotations
**What it lacks**: No automated ingestion, no topic tracking
**What we steal**: Annotation-as-knowledge pattern, search-first design

---

## Perplexity AI / You.com

**What it does**: Search with AI synthesis of results
**What it does well**: Fast, accurate answers with citations
**What it lacks**: Not persistent — no accumulated knowledge, no tracking over time
**What we steal**: Citation format, answer structure

---

## Google Scholar Alerts

**What it does**: Email alerts for new papers matching keywords
**What it does well**: Reliable, good for academic tracking
**What it lacks**: No synthesis, email delivery is archaic, no cross-source view
**What we steal**: Keyword-based matching, email/webhook delivery

---

## Feedly / Inoreader

**What it does**: RSS reader with AI features (summaries, trending detection)
**What it does well**: UI, source management, basic AI features
**What it lacks**: No contradiction detection, no knowledge accumulation, no RAG
**What we steal**: Source health monitoring, basic AI summarization

---

## What Nobody Does Well (Our Differentiator)

1. **Contradiction detection across sources** — No tool flags disagreements automatically
2. **Compounding knowledge** — Most tools are ephemeral; our system gets smarter over time
3. **Source quality evolution** — Most tools treat all sources equally; we weight by demonstrated accuracy
4. **Timeline tracking** — Not just "what happened today" but "how thinking evolved"
5. **Entity tracking** — Who are the new voices? Who stopped contributing? What tools emerged?
6. **Local-first** — No cloud lock-in, data stays local, re-processable

---

## Key Insight

The gap isn't in ingestion (Feedly does that well) or in querying (Perplexity does that well). The gap is in **the compounding knowledge loop** — where each cycle of ingestion, synthesis, and contradiction detection makes the system more expert than the last. No existing tool does this.

