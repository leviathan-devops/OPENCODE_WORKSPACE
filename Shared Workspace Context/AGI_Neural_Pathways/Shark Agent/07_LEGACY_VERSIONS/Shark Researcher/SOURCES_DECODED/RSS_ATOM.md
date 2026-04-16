# RSS/ATOM Sources — Decoded Patterns
## Substack, WordPress, personal blogs, newsletters

**Access pattern**: HTTP GET to feed URL, parse with feedparser
**Difficulty**: EASY
**Velocity**: Low to Medium

---

## Feed URL Patterns

| Platform | URL Pattern | Example |
|----------|------------|---------|
| Substack | `https://{slug}.substack.com/feed` | `https://www.shapedby.ai/feed` |
| WordPress | `https://{domain}/feed/` | `https://lilianweng.github.io/feed/` |
| Ghost | `https://{domain}/rss/` | `https://simonwillison.net/rss/` |
| Generic Atom | `https://{domain}/feed.xml` | `https://blog.pragmaticengineer.com/rss/` |

---

## What feedparser Extracts

```python
import feedparser

feed = feedparser.parse(url)
# feed.feed: feed-level metadata (title, description, link)
# feed.entries: list of entries

for entry in feed.entries:
    item = {
        'title': entry.get('title', ''),
        'link': entry.get('link', ''),
        'summary': entry.get('summary', ''),           # HTML summary
        'content': entry.get('content', [{}])[0].get('value', ''),  # Full HTML content
        'published': entry.get('published', ''),        # String, may be missing
        'published_parsed': entry.get('published_parsed'),  # struct_time
        'authors': entry.get('authors', []),            # List of {name} dicts
        'tags': [t['term'] for t in entry.get('tags', [])],
        'id': entry.get('id', entry.get('link', '')),   # Dedup key
    }
```

---

## Key Pitfalls

1. **HTML in content** — feedparser returns HTML, not plain text. Must strip/clean.
2. **Missing dates** — some feeds omit `published_parsed`. Use `updated` as fallback.
3. **Encoding issues** — some feeds declare wrong encoding. feedparser handles most but check `.bozo` flag.
4. **Rate limiting** — some blogs 429 if crawled frequently. 6-12h polling is safe.
5. **Feed size** — some feeds return only last 10-20 items. This means if you miss >20 items, they're gone. Poll regularly.

---

## Dedup Strategy

- Primary: entry.id or entry.link hash
- Fallback: title + author + date fingerprint
- Cross-source: title similarity + same author → likely same article

---

## Content Cleaning

```python
from bs4 import BeautifulSoup
import html2text

def clean_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    # Remove scripts, styles, nav elements
    for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
        tag.decompose()
    h = html2text.HTML2Text()
    h.ignore_links = False
    return h.handle(str(soup))
```

