# Telegram Sources — Decoded Patterns
## Public channels, private channels, group chats

**Access pattern**: MTProto (Telethon) or web scraping
**Difficulty**: MEDIUM
**Velocity**: High

---

## Option 1: Public Channel Scraping (No Auth)

```python
import requests
from bs4 import BeautifulSoup

# Public channel web view
url = f'https://t.me/s/{channel_name}'
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0...'})
soup = BeautifulSoup(resp.text, 'html.parser')

for msg in soup.select('.tgme_widget_message'):
    text = msg.select_one('.tgme_widget_message_text')
    date = msg.select_one('.tgme_widget_message_date')
    views = msg.select_one('.tgme_widget_message_views')
    # Limited to recent messages visible on page
```

Works for public channels without auth. Returns last ~20-50 messages.

---

## Option 2: Telethon (MTProto — Full Access)

```python
from telethon import TelegramClient

client = TelegramClient('session_name', API_ID, API_HASH)
await client.start(phone)  # Interactive auth

# Get messages from a channel
channel = await client.get_entity(channel_name_or_id)
messages = await client.get_messages(channel, limit=100)

for msg in messages:
    item = {
        'text': msg.message,
        'date': msg.date.isoformat(),
        'id': msg.id,
        'views': msg.views,
        'forwards': msg.forwards,
        'media_urls': [m.url for m in msg.media if hasattr(m, 'url')] if msg.media else [],
    }
```

**Getting API credentials**: https://my.telegram.org → App → API ID + Hash
This is free and gives you full Telegram access with a phone number.

---

## Option 3: Telegram Bot API (For Groups)

If you're an admin, use a bot to forward messages:

```python
# Bot forwards all messages from channels to your bot
# Use webhook or polling
```

Limitation: bot can only see messages in channels it's a member of.

---

## Key Pitfalls

1. **Session expires** — Telethon sessions expire. Implement re-auth.
2. **Rate limits** — FloodWait errors are common. Add 1-2 second delays between channel polls.
3. **Private channels** — Need to be a member. Telethon handles this with user account.
4. **Message formatting** — Telegram messages can have formatting, links, media. Preserve or strip?
5. **Forward tracking** — Some messages are forwarded from other channels. Track original source.

---

## Public Channel RSS

Some channels have RSS via bridges:
```
https://rsshub.app/telegram/channel/{channel_name}
https://tg.i-c-a.su/rss/{channel_name}
```

RSSTHub is the most reliable self-hosted option for Telegram RSS.

