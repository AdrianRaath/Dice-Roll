# QuickDice -Site Structure

## Overview

QuickDice is a free online dice roller. The site consists of a **home page** and **60 dedicated roll pages** (one per dice/sides combination).

---

## Pages

### Home Page (`/` → `index.html`)

- **Default config:** 1 die, 6 sides
- **Title:** `Roll Dice Online - Free Virtual Dice Roller | QuickDice`
- **H1:** `Roll Dice Online`
- **Subtitle:** `Pick your dice 🎲, choose your sides, and let fate decide`
- **Content:** Full SEO content sections (intro, how-to, use cases)
- **Dropdowns:** Changing either dropdown navigates to the corresponding dedicated roll page

### Roll Pages (`/{n}-dice/{s}-sides/index.html`)

- **Total:** 60 pages (1–6 dice × 1–10 sides)
- **URL pattern:** `/{n}-dice/{s}-sides/` (e.g., `/3-dice/6-sides/`)
- **Title pattern:** `{n}d{s} Dice Roller | Roll {n} {s}-Sided {Die/Dice} Online`
  - Use "Die" when n=1, "Dice" when n>1
  - Examples:
    - `1d6 Dice Roller | Roll 1 6-Sided Die Online`
    - `3d6 Dice Roller | Roll 3 6-Sided Dice Online`
    - `2d10 Dice Roller | Roll 2 10-Sided Dice Online`
- **H1 pattern:** `Roll {n}d{s} Online`
- **Subtitle pattern:** `Roll {n} {die/dice} with {s} {side/sides} -instant, fair, and random`
- **Meta description pattern:** `Roll {n}d{s} online with QuickDice. Instant {n} {die/dice} with {s} {side/sides} roller -free, random, and fair. No app needed.`
- **Content:** No long-form SEO content (avoids duplicate/scaled content penalties)
- **Extra section:** "Other popular rolls" -internal links to related roll pages for crawlability
- **Dropdowns:** Pre-selected to match the page's dice/sides. Changing either navigates to that page.

---

## URL Structure

```
/                          → index.html (home)
/1-dice/1-sides/           → 1-dice/1-sides/index.html
/1-dice/2-sides/           → 1-dice/2-sides/index.html
...
/6-dice/10-sides/          → 6-dice/10-sides/index.html
```

---

## Shared Assets

All pages reference shared assets via relative paths:

| Asset                  | Home page path            | Roll page path                |
|------------------------|---------------------------|-------------------------------|
| `styles.css`           | `styles.css`              | `../../styles.css`            |
| `script.js`            | `script.js`               | `../../script.js`             |
| `assets/dice-logomark.svg` | `assets/dice-logomark.svg` | `../../assets/dice-logomark.svg` |

---

## Navigation Behavior

- **Logo:** Always links to `/` (home page)
- **Dropdowns:** On change, navigate to the matching `/{n}-dice/{s}-sides/` page
  - Exception: if the selection matches 1d6 (home page default), navigate to `/`
- **Roll button:** Works in-place (no navigation), rolls with the current page's config

---

## File Generation

A build script (`build.js`) generates the 60 roll pages from the home page template. When updating the site:

1. **Design/layout changes** → Edit `styles.css`, `script.js`, or the home `index.html`
2. **Re-generate roll pages** → Run `node build.js`
3. **Per-page content** (titles, descriptions, subtitles) → Edit the templates/logic in `build.js`

---

## Design Tokens

All visual styling is controlled via CSS custom properties in `styles.css`. Key tokens:

- **Colors:** `--color-accent: #2d6a4f` (dark forest green), `--color-bg: #f8f6f1`
- **Fonts:** `--font-heading: 'Figtree'`, `--font-body: 'Inter'`
- **Dice:** `--dice-size: 140px`, `--dice-dot-size: 22px`

See `styles.css` `:root` block for the full token list.

---

## Internal Linking ("Other Popular Rolls")

Each roll page includes a curated set of links to other roll pages. Selection logic:

- Same number of dice, different sides (e.g., from 3d6: link to 3d4, 3d8, 3d10)
- Same sides, different number of dice (e.g., from 3d6: link to 1d6, 2d6, 4d6)
- Most popular combinations (1d6, 2d6, 1d20 equivalents within range, etc.)
- Cap at ~8–12 links per page
