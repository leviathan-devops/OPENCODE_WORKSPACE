# GitHub Sources — Decoded Patterns
## Repos, releases, discussions, issues, trending

**Access pattern**: REST API / GraphQL / Release RSS
**Difficulty**: EASY
**Velocity**: Medium

---

## Option 1: Release RSS (Simplest)

```
https://github.com/{owner}/{repo}/releases.atom
https://github.com/{owner}/{repo}/tags.atom
```

Each release/tag becomes an RSS entry. Zero API calls needed.

---

## Option 2: REST API

```python
from github import Github

g = Github(TOKEN)  # 5000 req/hr authenticated
repo = g.get_repo('owner/repo')

# Releases
for release in repo.get_releases():
    pass

# Recent commits
for commit in repo.get_commits()[:20]:
    pass

# Open discussions (if enabled)
# Need GraphQL for discussions
```

---

## Option 3: GitHub GraphQL API (for Discussions)

```graphql
query {
  repository(owner: "huggingface", name: "transformers") {
    discussions(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        title
        bodyText
        author { login }
        createdAt
        updatedAt
        labels(first: 5) { nodes { name } }
        category { name }
        comments(first: 5) {
          nodes { bodyText, author { login }, createdAt }
        }
      }
    }
  }
}
```

Discussions are the highest-value GitHub content for research — that's where people share insights, not just code.

---

## Option 4: Trending API

Track trending repos on a topic:

```python
import requests

# Use unofficial trending API
resp = requests.get(f'https://api.gitterapp.com/repositories?language=python&since=weekly')
# Or scrape: https://github.com/trending/python?since=weekly
```

---

## Key Pitfalls

1. **Rate limits**: 5000 req/hr authenticated, 60/hr unauthenticated. Always authenticate.
2. **Discussion body**: Can be very long. Truncate at 10k chars for ingestion.
3. **Repo activity**: Some repos release daily (noisy). Set per-repo polling intervals.
4. **Content in commits**: Commit messages are short but meaningful. Don't ignore them for major repos.

