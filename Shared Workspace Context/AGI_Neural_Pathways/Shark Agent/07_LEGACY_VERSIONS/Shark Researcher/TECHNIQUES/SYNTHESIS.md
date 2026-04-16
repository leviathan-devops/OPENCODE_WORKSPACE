# SYNTHESIS TECHNIQUES — How Shark Researcher Synthesizes Knowledge
## Prompt templates, contradiction detection, trend tracking

**Date**: 2026-04-02

---

## Synthesis Levels

Shark operates at 3 synthesis levels, each building on the prior:

| Level | Frequency | Input Size | Output | Purpose |
|-------|-----------|-----------|--------|---------|
| Daily Digest | Every 24h | 10-50 items | 500-800 word markdown | Quick scan of new developments |
| Weekly Synthesis | Every 7 days | 50-500 items + prior syntheses | 1000-2000 word report | Trend analysis, consensus tracking |
| Monthly Retrospective | Every 30 days | 4 weekly syntheses | 2000-4000 word report | Evolution, forecasts, source management |

---

## Daily Digest Template

```markdown
# {Topic Name} — Daily Briefing
## {Date}

### Top Developments

**1. {Title of key development}**
- What: {summary}
- Source: [{source}]({url}) (weight: {weight})
- Why it matters: {impact}

### Contradictions Detected

- {source_a} claims X, but {source_b} argues Y
- Context: {explanation}

### New Entities

- People: {names}
- Tools: {tools}
- Papers: {papers}

### Activity Summary

- Items ingested today: {N}
- Average relevance: {score}
- Top source today: {source}
```

---

## Weekly Synthesis Template

```markdown
# {Topic Name} — Weekly Synthesis
## Week of {Date Range}

### What Changed This Week

{Narrative of key shifts, 3-4 paragraphs}

### Current Consensus on Key Debates

**Debate 1: {Topic}**
- Position A: {summary} — held by {sources}
- Position B: {summary} — held by {sources}
- This week's shift: {direction}

### Contradictions and Disagreements

{List of active contradictions, unresolved debates}

### Emerging Voices

- {Person}: First appearance this week. Claim: {claim}.
- {Person}: Increasingly cited. Recent claim: {claim}.

### Source Health

| Source | Items | Used | Status |
|--------|-------|------|--------|
| {A} | {N} | {M} | {status} |
```

---

## Contradiction Detection Strategy

**Step 1: Claim Extraction**
Every item gets key_claims during processing. Claims are stored as:

```json
{
  "claim": "DPO outperforms GRPO for reasoning tasks",
  "context": "benchmark results on MATH dataset",
  "confidence": "high",  # from source tone
  "negation": "performance of method X on task Y"
}
```

**Step 2: Claim Indexing**
Build an inverted index of negation terms:

```
"performance of DPO on MATH" → [item_id_1, item_id_3, item_id_7]
"effectiveness of GRPO" → [item_id_2, item_id_4, item_id_7]
```

**Step 3: Similarity Search**
For each new claim:
- Find existing claims with similar negation (embedding similarity > 0.7)
- If found, check for contradiction

**Step 4: Contradiction Judgment**
LLM prompt:
```
Claim A: "{claim_a}" from {source_a} ({date_a})
Claim B: "{claim_b}" from {source_b} ({date_b})

Are these claims in contradiction?
- YES: factual disagreement (one must be wrong)
- YES: methodological disagreement (different approaches, both valid)
- YES: interpretation disagreement (same data, different conclusions)
- NO: compatible claims
- UNSURE: need more context

Explain your reasoning in 2-3 sentences.
If temporal: did one supersede the other?
```

**Step 5: Contradiction Resolution**
- Store in contradictions table
- Flag for review in next synthesis
- Track if superseded by newer evidence
- In synthesis: present both sides with evidence

---

## Source Weight Calibration

Monthly recalibration:

```python
def compute_source_weight(source, period_days=30):
    recent = get_items(source.id, days=period_days)
    recent_relevant = [i for i in recent if i.relevance_score > 0.5]
    
    # Component 1: Usage rate (did synthesis use these items?)
    usage_rate = source.items_used_count / max(len(recent), 1)
    
    # Component 2: Average relevance
    avg_rel = source.items_used_in_synthesis / max(len(recent_relevant), 1)
    
    # Component 3: Reliability (low error rate)
    reliability = 1 - (source.error_count / max(period_days * 6, 1))
    
    # Component 4: Novelty (new entities/claims discovered)
    novelty = compute_novelty_score(recent)  # % of items with new entities
    
    weight = (
        0.35 * usage_rate +
        0.30 * avg_rel +
        0.20 * reliability +
        0.15 * novelty
    )
    
    # Smooth: new weight = 0.7 * old + 0.3 * computed
    smoothed = 0.7 * source.weight + 0.3 * weight
    
    # Clamp
    smoothed = max(0.0, min(1.0, smoothed))
    
    # Status update
    if len(recent) == 0 and period_days >= 30:
        source.status = 'dead'
        return 0.0
    elif source.error_count > period_days * 0.5:
        source.status = 'degraded'
        return smoothed * 0.5
    
    source.status = 'active'
    return smoothed
```

