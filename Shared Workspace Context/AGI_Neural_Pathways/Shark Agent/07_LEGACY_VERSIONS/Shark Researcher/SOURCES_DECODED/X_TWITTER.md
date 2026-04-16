# X/Twitter Sources — Decoded Patterns
## Official API, RSS bridges, and scraping alternatives

**Access pattern**: Various — no single reliable free option
**Difficulty**: HARD
**Velocity**: High

---

## Option 1: RSS Bridge (Recommended)

Self-hosted RSS-Bridge can convert X profiles/hashtags to RSS:

```
# RSS-Bridge instance
https://your-rss-bridge.tld/?action=display&bridge=X&username=karpathy&format=Atom

# Third-party RSS converters
https://rss.app/feeds/{ID}                          # Paid, reliable
https://feed.informer.com/feeds/{ID}               # Free tier
```

Each tweet becomes an RSS entry with text, author, date, URL.

---

## Option 2: Twitter API v2

**Free tier**: 1500 tweets/month read, 1000/month write — too limiting for monitoring
**Basic tier**: $100/month, 10,000 tweets/month
**Pro tier**: $5,000/month

```python
import tweepy

client = tweepy.Client(bearer_token=TOKEN)
# Get user timeline
response = client.get_users_tweets(
    user_id=USER_ID,
    max_results=100,
    tweet_fields=['created_at', 'public_metrics', 'referenced_tweets'],
    exclude=['retweets', 'replies']
)
```

Only viable if you have paid tier and need specific users' timelines.

---

## Option 3: List Monitoring (Best Signal/Noise)

Create X Lists of experts, monitor the list feed instead of individual accounts:

```
# List members are curated experts
# Poll the list timeline RSS
# Less noise, more signal than monitoring everyone
```

---

## Key Pitfalls

1. **Nitter is dead** — All public Nitter instances are down. Don't rely on them.
2. **RSS bridges break** — X changes HTML/API frequently. Have 2-3 bridge options.
3. **Rate limits** — All options have limits. Space requests.
4. **Thread handling** — Long threads may be separate items. Consider grouping by conversation_id.
5. **Media-only tweets** — Some important tweets are just images. Handle media_urls.

---

## Data Model for Tweets

```python
tweet = {
    'title': tweet_text[:100],          # Truncated for RSS
    'body_text': tweet_text,
    'author': username,
    'published_at': created_at,
    'url': f'https://x.com/{username}/status/{tweet_id}',
    'media_urls': media,               # Images/videos
    'reply_count': public_metrics.get('reply_count'),
    'like_count': public_metrics.get('like_count'),
    'retweet_count': public_metrics.get('retweet_count'),
}
```

