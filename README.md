# Members-Only Remover

**No gaps. No shelf. No fuss.**

Filters out **"Members-only" videos** from YouTube pages — including search results, channel videos tabs, homepage shelves, and suggestions. Removes entire tiles and shelves seamlessly, so the layout stays clean and uninterrupted.

---

## 🔍 What It Does

This userscript automatically:

- Removes videos labeled “Members-only” from:
  - Homepage suggestions  
  - Channel videos tab  
  - Search results  
  - Playlist views and sidebars  
- Eliminates the “Members-only videos” shelf on channel home pages.
- Ensures video grids remain *clean* and *gapless* — like the content was never there.
- Works proactively on both **network responses** and **DOM elements**, with full MutationObserver support.

---

## ✅ Why This Exists

YouTube aggressively surfaces member-locked content even to non-members, including Premium users — effectively advertising gated material inside your regular feed. This script restores control by hiding what you can't access, without breaking the layout or leaving blank spaces.

---

## 📸 Before and After

> Side-by-side: Left = Script **Disabled**, Right = Script **Enabled**

![before-and-after](https://i.ibb.co/ynV8Tt8k/image-3.png)

*No manual filtering. No leftover tiles. No wasted space.*

---

## ⚙️ How It Works

- **Intercepts** `fetch()` and `XMLHttpRequest` responses to scrub member-only items from YouTube’s JSON API before the UI renders.
- **Recursively detects** “members-only” markers in deeply nested structures (`style`, `badgeStyle`, `text`, etc.).
- **Removes DOM elements** as fallback, scanning for badges like `badge-style-type-members-only` and pruning matching tiles.
- Reacts to YouTube’s dynamic navigation (`yt-navigate-finish`, `yt-page-data-updated`) to re-scan content that loads after initial page load.

---

## 💡 Design Goals

- Zero visual footprint  
- Fail-open (never breaks the page)  
- Lightweight and self-contained  
- Doesn’t bypass paywalls or spoof credentials  
- No external dependencies or tracking  

---

## 🔒 Safety & Terms

This script:

- Runs client-side only  
- Makes no additional server requests  
- Doesn’t access private content or perform unauthorized actions  
- Is intended for **personal use only**, in accordance with YouTube’s TOS

> Think of it like a content filter — not a bypass.

---

## 🧪 Known Limitations

- May miss newly introduced "members-only" formats or UI elements (e.g., Shorts, future renderer types)
- Script may require occasional updates when YouTube changes its internal structure
- Currently tested on English locale; detection may miss localized labels in other languages

---

## 📦 Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)

2. Install the script from Greasy Fork:
   - [https://greasyfork.org/en/scripts/554540-members-only-remover](https://greasyfork.org/en/scripts/554540-members-only-remover)

---

## 💬 Feedback & Contributions

Bug reports, feature requests, and contributions welcome via [GitHub Issues](https://github.com/Mr005K/YTmembersonlyremover/issues/).

> This project is open source (MIT License).

---

## ✍️ Author

Mr005K  
Built out of necessity. Maintained out of principle.
