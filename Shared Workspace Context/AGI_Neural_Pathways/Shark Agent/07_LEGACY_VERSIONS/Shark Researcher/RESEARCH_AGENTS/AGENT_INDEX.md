# RESEARCH AGENT ROLES — Shark Researcher
## Agent definitions for research roles in the system

**Date**: 2026-04-02

---

## Agent Roles

Shark Researcher uses LLMs in 4 distinct roles:

| Role | Model Tier | Frequency | Purpose |
|------|-----------|-----------|---------|
| Research Analyst | Full | Per-item (phase 2) | Summary, claims, entities extraction |
| Synthesis Analyst | Full | Daily/weekly/monthly | Briefings, trend analysis, forecasts |
| Contradiction Judge | Full | Per-pair | Contradiction detection judgment |
| RAG Responder | Full | On-demand | Answer user questions with citations |

---

## 1. Research Analyst (Item Processing)

**When called**: Every new item enters the processing pipeline
**Input**: Raw content + topic context
**Output**: Structured summary + claims + entities + relevance score

```
You are a research analyst specializing in {topic_name}.
Analyze the following document and extract structured information.

DOCUMENT:
{content}

TOPIC: {topic_name}
DESCRIPTION: {topic_description}

Respond with JSON:
{
  "summary": "3-5 sentences. Focus on what changed or what's new, not background.",
  "key_claims": ["Specific, testable claims from the document"],
  "entities": {
    "people": ["People mentioned who are relevant to the topic"],
    "tools": ["Tools, frameworks, libraries mentioned"],
    "papers": ["Paper titles, arXiv IDs, or DOIs"],
    "repos": ["GitHub repo mentions as owner/name"]
  },
  "tags": ["3-5 descriptive tags"],
  "relevance_score": 0.8,
  "confidence": "high|medium|low"
}

Rules:
- Summary must be independent (understandable without the original)
- Claims must be specific enough to compare against other claims
- Include negated forms of claims for contradiction detection
- Relevance is 0-1 for this specific topic
- Confidence reflects how well-supported claims are in the source
```

---

## 2. Synthesis Analyst (Periodic Briefings)

**When called**: Scheduled (daily/weekly/monthly)
**Input**: Items + prior syntheses + contradictions
**Output**: Markdown briefing

See TECHNIQUES/SYNTHESIS.md for prompt templates per cadence.

Key principle: The synthesis should read like it was written by someone who has been following this topic for months. It should track evolution, not just list items.

---

## 3. Contradiction Judge

**When called**: When similar claims found from different sources
**Input**: Two claims with context
**Output**: Contradiction verdict + explanation

```
Claim A: "{claim_a}"
Source A: {source_a} | Date: {date_a}
Context A: {context_a}

Claim B: "{claim_b}"
Source B: {source_b} | Date: {date_b}
Context B: {context_b}

Are these claims in genuine contradiction?

Verdict:
- FACTUAL: Direct factual disagreement. One is wrong.
- METHODOLOGICAL: Different methods, different results. Both may be valid.
- INTERPRETIVE: Same evidence, different conclusions.
- TEMPORAL: One supersedes the other due to new evidence.
- COMPATIBLE: Not contradictory despite surface similarity.

Explanation: 2-3 sentences.
If temporal: which claim is more recent/relevant?
If methodological: what key difference causes the discrepancy?
```

---

## 4. RAG Responder (On-Demand Queries)

**When called**: User asks a question
**Input**: Question + retrieved context (top 8 items)
**Output**: Answered question with citations

```
You are a domain expert in {topic_name}.

QUESTION: {question}

CONTEXT (from {N} sources):
{context_block}

Answer the question using only the provided context.
- Cite sources as [source_id] or [source_name]
- Distinguish facts from opinions
- Note disagreements between sources
- If the context doesn't support an answer, say so
- If you can answer partially, do so, noting gaps

Format: Direct answer with citations. No preamble.
```

---

## Model Tiering

| Role | Recommended Model | Cost Concern |
|------|------------------|-------------|
| Research Analyst | qwen3.6-plus (or equivalent) | High — called per-item, batch if possible |
| Synthesis Analyst | qwen3.6-plus (or equivalent) | Medium — called daily/weekly |
| Contradiction Judge | qwen3.6-turbo (or equivalent) | Low — called per-pair, fast task |
| RAG Responder | qwen3.6-plus (or equivalent) | Low — called on-demand only |

Batch processing for the Research Analyst role: collect 10-50 items, send as single prompt with structured output, saves 80-90% vs per-item calls.

