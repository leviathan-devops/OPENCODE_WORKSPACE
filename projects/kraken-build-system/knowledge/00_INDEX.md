# KNOWLEDGE LIBRARY INDEX

**Purpose:** Index of all topic-specific knowledge files
**Location:** This directory

---

## KNOWLEDGE FILES

| File | Topic | Status | Created |
|------|-------|--------|---------|
| 00_INDEX.md | This index | ACTIVE | START_DATE |

---

## ADDING KNOWLEDGE FILES

Create new knowledge files with template:

```bash
cat > "(PROJECT_PATH)/knowledge/{TOPIC_NAME}.md" << 'EOF'
# {TOPIC NAME}

**Created:** {DATE}
**Updated:** {DATE}
**Status:** DRAFT
**Confidence:** MEDIUM

---

## SUMMARY

{2-3 sentence overview}

---

## KEY POINTS

1. {point}
2. {point}
3. {point}

---

## TECHNICAL DETAILS

{Deep dive}

---

## RELATED

- Related file
- Related topic

---

## LOG

| Date | Change |
|------|--------|
| {DATE} | Created |
EOF
```

Then update this index.

---

## KNOWLEDGE CATEGORIES

| Category | Description |
|----------|-------------|
| ARCHITECTURE | System design and structure |
| DEBUG | Troubleshooting guides |
| PATTERNS | Reusable patterns |
| DECISIONS | Architectural decisions |
| TECH | Technical deep dives |

---

## MAINTENANCE

- Review knowledge files monthly
- Update stale information
- Archive obsolete files

---

**END OF INDEX**
