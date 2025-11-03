// ==UserScript==
// @name         Members-Only Remover 
// @namespace    https://example.com/memonly
// @version      1.0
// @description  Filters Members-only entries out of YouTube API responses, and removes the members-only shelf.
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @grant        none
// @author       Mr005k 
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  // ---------- Detection ----------
  const MEM_RE = /\bmembers\s*[- ]?\s*only\b/i;

  function extractText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj.simpleText) return String(obj.simpleText);
    if (Array.isArray(obj.runs)) return obj.runs.map(r => r && r.text || '').join('');
    if (obj.text) return extractText(obj.text);
    if (obj.label) return String(obj.label);
    return '';
  }

  function nodeLooksMembersOnly(o) {
    if (!o || typeof o !== 'object') return false;
    // Direct style flags used by YT JSON
    if (typeof o.style === 'string' && o.style.includes('MEMBERS_ONLY')) return true;
    if (typeof o.badgeStyle === 'string' && o.badgeStyle.includes('MEMBERS_ONLY')) return true;

    // Textual labels
    if (MEM_RE.test(extractText(o))) return true;

    return false;
  }

  function deepHasMembersOnly(o, depth = 0) {
    if (depth > 6 || !o) return false;
    if (nodeLooksMembersOnly(o)) return true;

    if (Array.isArray(o)) {
      for (const it of o) if (deepHasMembersOnly(it, depth + 1)) return true;
      return false;
    }
    if (typeof o === 'object') {
      for (const k in o) {
        // Skip huge binary-ish fields
        if (k === 'playerResponse' || k === 'responseContext') continue;
        if (deepHasMembersOnly(o[k], depth + 1)) return true;
      }
    }
    return false;
  }

  // Remove any array item whose subtree advertises "Members only"
  function scrubJSON(x, depth = 0) {
    if (depth > 8 || x == null) return x;
    if (Array.isArray(x)) {
      const out = [];
      for (const it of x) {
        if (deepHasMembersOnly(it)) continue;
        out.push(scrubJSON(it, depth + 1));
      }
      return out;
    }
    if (typeof x === 'object') {
      for (const k in x) x[k] = scrubJSON(x[k], depth + 1);
    }
    return x;
  }

  // ---------- Network interception (fetch + XHR) ----------
  const shouldFilterURL = url =>
    typeof url === 'string' &&
    /\/youtubei\/v1\/(browse|search|next|reel|guide)/.test(url);

  // fetch
  const _fetch = window.fetch;
  window.fetch = async function(input, init) {
    const res = await _fetch(input, init);
    try {
      const url = (typeof input === 'string' ? input : input.url) || res.url || '';
      if (!shouldFilterURL(url)) return res;

      const clone = res.clone();
      const data = await clone.json();
      const scrubbed = scrubJSON(data);
      // If nothing changed, pass original response
      if (JSON.stringify(data) === JSON.stringify(scrubbed)) return res;

      const body = JSON.stringify(scrubbed);
      const headers = new Headers(res.headers);
      headers.set('content-type', 'application/json; charset=UTF-8');
      return new Response(body, { status: res.status, statusText: res.statusText, headers });
    } catch (_) {
      return res; // fail open
    }
  };

  // XHR (some pages still use it)
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    this.__yt_url = url;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('readystatechange', function() {
      if (this.readyState !== 4) return;
      try {
        if (!shouldFilterURL(this.__yt_url)) return;
        const text = this.responseText;
        const json = JSON.parse(text);
        const scrubbed = scrubJSON(json);
        const newText = JSON.stringify(scrubbed);
        if (newText !== text) {
          Object.defineProperty(this, 'responseText', { value: newText });
          Object.defineProperty(this, 'response', { value: newText });
        }
      } catch (_) {}
    });
    return _send.apply(this, arguments);
  };

  // ---------- DOM fallback (strict) ----------
  const ITEM_SEL = [
    'ytd-rich-item-renderer',
    'yt-lockup-view-model',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-radio-renderer',
    'ytd-reel-item-renderer',
    'ytd-reel-video-renderer'
  ].join(',');

  const POLYMER_BADGE = '.badge.badge-style-type-members-only';
  const VM_BADGE_TEXT = '.yt-badge-shape--commerce .yt-badge-shape__text';

  function isStrictBadge(el) {
    if (!(el instanceof Element)) return false;
    if (el.matches(POLYMER_BADGE)) return true;
    if (el.matches(VM_BADGE_TEXT) && MEM_RE.test(el.textContent || '')) return true;
    return false;
  }

  function dropTileFromBadge(badge) {
    const item = badge.closest(ITEM_SEL);
    if (item) item.remove();
  }

  function pruneMembersShelf(root = document) {
    // Remove the channel home shelf titled "Members-only videos"
    document.querySelectorAll('ytd-shelf-renderer').forEach(shelf => {
      const title = (shelf.querySelector('#title')?.textContent || '').trim();
      const subtitle = (shelf.querySelector('#subtitle')?.textContent || '').trim();
      if (MEM_RE.test(title) || /videos available to members/i.test(subtitle)) {
        shelf.remove();
      }
    });
  }

  function scanDOM(root = document) {
    root.querySelectorAll(POLYMER_BADGE).forEach(dropTileFromBadge);
    root.querySelectorAll(VM_BADGE_TEXT).forEach(n => {
      if (MEM_RE.test(n.textContent || '')) dropTileFromBadge(n);
    });
    pruneMembersShelf(root);
  }

  function observeDOM() {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (isStrictBadge(n)) dropTileFromBadge(n);
            else scanDOM(n);
          }
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    const rescan = () => setTimeout(() => { scanDOM(document); }, 50);
    window.addEventListener('yt-navigate-finish', rescan);
    window.addEventListener('yt-page-data-updated', rescan);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { scanDOM(); observeDOM(); });
  } else {
    scanDOM(); observeDOM();
  }
})();
