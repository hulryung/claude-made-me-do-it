# UI Redesign — Design Doc

**Date:** 2026-04-29
**Project:** `claude-made-me-do-it`
**Status:** Approved (pending implementation)
**Supersedes the UI sections of:** `2026-04-29-paste-cleaner-design.md` (algorithm sections of that earlier spec are unchanged and still authoritative)

## 1. Overview

The first version of `claude-made-me-do-it` shipped with a minimal two-textarea layout. This redesign rebuilds the UI to a richer visual identity matching the provided mockup, while keeping the algorithm, file structure, and "no build, no framework" constraint intact.

**What changes:**
- Header with handwritten-style title, speech-bubble illustration, three feature badges, and a Light/Dark toggle.
- Code panels gain numbered step badges, a line-number gutter, and leading-whitespace dot visualization (`·` for spaces, `→` for tabs).
- Two supporting cards underneath the panels: a "What this does" explainer with a small dedent diagram, and a smart-exception note.
- A redesigned stats footer with three labeled metrics and an info box explaining how this differs from generic trim tools.
- A page footer with attribution and a GitHub link.

**What stays the same:**
- `cleanText(raw)` algorithm and its 19-assertion test page (`tests.html`) are untouched.
- Single `index.html` + `clean.js`. No build step, no framework.
- All processing remains client-side; pasted text never leaves the browser.

**Constraint relaxations (intentional):**
- One new external dependency: a Google Fonts `<link>` for the handwritten title font (`Caveat`) and a clean body font (`Inter`). No JS dependency, no CDN scripts.
- All UI copy is **English** for v1; a Korean variant is a future task.

## 2. UI Structure

### 2.1 Page layout (desktop, ≥ 768px)

```
┌──────────────────────────────────────────────────────────────────┐
│  [speech bubble]    Claude Made Me Do It          [Light | Dark] │  Header
│                     (handwritten, "It" underlined)    Follows OS │
│                     Strips the leftover whitespace AI loves…  🧹 │
│                                                                  │
│        [🔒 100% Private]  [🛡 No Upload]  [⚡ Instant]           │  Feature badges
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌── 1 Paste AI-copied text… Ctrl/⌘+V ──┐  → ┌── 2 Cleaned out… [Copy] ──┐
│   │ 1 │ ····def greet(name: str)…        │     │ 1 │ def greet(name: str)…│
│   │ 2 │ ········message = …              │     │ 2 │   message = …        │  Code panels
│   │ … │ …                                │     │ … │ …                    │
│   └─────────────────────────────────────┘     └────────────────────────┘
│                                                                  │
│   [💡 What this does — explainer + small dedent diagram]          │  Supporting
│                            [✨ Smart exception note]              │  cards
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Lines: 12]  [Removed: 4 spaces]  [Trailing: ✓]                 │  Stats
│                                  [ℹ AI paste-aware info box]    │
├──────────────────────────────────────────────────────────────────┤
│  ❤ tagline    |    Made with ☕ and frustration    | GitHub link │  Footer
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Header

- **Speech bubble (top-left, ~80px wide):** an inline SVG showing a small terminal box (`>_`) with a speech-bubble shape pointing right, containing the text "No more whitespace." in a slightly playful style.
- **Title:** `Claude Made Me Do It` rendered in `Caveat` (handwritten). The word `It` is wrapped in a span and gets a hand-drawn-feel purple underline (an SVG used as `background-image` of the span).
- **Tagline:** `Strips the leftover whitespace AI loves to add.` followed by 🧹 emoji. Sans-serif, muted color.
- **Light/Dark toggle (top-right):** a pill-shaped two-button toggle. The active mode is highlighted with the accent color and a subtle shadow. Underneath, a small purple curved arrow SVG points up at the toggle, captioned `Follows your OS by default.` in muted text.

### 2.3 Feature badges

- A row of three inline badges placed below the header, above the panels.
- Each badge is `[icon] [bold title] [muted subtitle]`:
  - 🔒 **100% Private** — Runs entirely in your browser.
  - 🛡 **No Upload** — Nothing leaves your tab.
  - ⚡ **Instant** — Cleaned the moment you paste.
- Icons are inline SVGs (lock, shield, lightning bolt) — no icon-font dependency.

### 2.4 Code panels

Two panels side by side: input on the left, output on the right. A small right-arrow SVG sits between them on desktop (rotates to a down-arrow on mobile).

**Single panel structure:**

```html
<section class="code-pane">
  <header class="code-pane-header">
    <span class="step-badge">1</span>
    <span class="code-pane-title">Paste AI-copied text here</span>
    <span class="code-pane-hint">Ctrl / ⌘ + V</span>   <!-- input only -->
    <button class="copy-btn">Copy</button>             <!-- output only -->
  </header>
  <div class="code-area">
    <div class="line-numbers" aria-hidden="true">1\n2\n3\n…</div>
    <pre class="ws-overlay" aria-hidden="true">…</pre>
    <textarea class="code-input"></textarea>
  </div>
</section>
```

**Whitespace overlay rules:**

- The overlay `<pre>` mirrors the textarea's content with the same font, font-size, line-height, padding, and word-wrap settings, positioned absolutely behind the textarea.
- The overlay's text color is `transparent`. Only its leading whitespace runs are colored (muted accent), with each space character replaced by `·` (U+00B7) and each tab character replaced by `→` (U+2192). Trailing whitespace is left transparent — it's invisible to the user, since the algorithm strips it on output anyway.
- The overlay is updated on every `input` event on the textarea.
- The overlay scrolls in lockstep with the textarea via the `scroll` event.
- The textarea has `background: transparent` and `color: var(--fg)`, so the actual text reads through the overlay.

**Line-number gutter:**

- A separate `<div class="line-numbers">` to the left of the textarea, same `line-height` and `font-family`.
- Updated on every `input` event: `lineCount = (text.match(/\n/g)?.length ?? 0) + 1`.
- `min-width: 2.5em`, right-aligned, muted text. Stays readable up to 999 lines without layout shift.
- Scrolls with the textarea on the `scroll` event.

**Step badge:** a small filled circle (`1` or `2`) in the panel header, accent color, white text.

**Copy button (output panel only):** keeps the existing wiring from the current `index.html` — `navigator.clipboard.writeText` with `execCommand('copy')` fallback, success/failure toggle (`Copied!` / `Copy failed`) for 1.5s, re-entry guard, timer cleanup. Visually moves to the panel header (right-aligned).

**Inter-panel arrow:** a small chevron SVG (24×24px) centered between the two panels on desktop. On mobile (< 768px), the arrow rotates 90° (down).

### 2.5 Supporting cards

Below the code panels, two cards arranged in the same two-column grid:

- **Left ("What this does"):** A 💡 icon and the heading `What this does`, followed by `Removes the common leading indent and trailing whitespace from each line. Your code's relative indentation stays intact.` Right side of the card holds a small inline SVG diagram showing a "before/after" of leading-indent removal (two stacks of horizontal lines, the second with the gray prefix portion removed).
- **Right (smart-exception note):** A ✨ icon and the line `Detects partial-copy artifacts at the first or last line and fixes them automatically.`

### 2.6 Stats footer

A horizontal bar with three metric tiles on the left and one info box on the right.

- **Metrics (left):**
  1. `Lines` + the integer `linesOut` (renamed from current `Lines:`)
  2. `Removed common indent` + the prefix description (e.g., `4 spaces`, `1 tab`, `2 spaces + 1 tab`)
  3. `Trailing spaces trimmed` + a checkmark `✓` when any trailing whitespace was stripped, or a dash `—` otherwise.
- **Info box (right):** A bordered card with an `ℹ` icon and the text:
  > AI paste-aware. Different from generic trim tools — it removes only the shared leading indent. Your code structure stays intact.

### 2.7 Page footer

A single horizontal row with three slots:

- **Left:** ❤ icon + `Made because Claude Code's copy-paste keeps breaking my terminal.`
- **Center:** `Made with ☕ and frustration`
- **Right:** `Open source • [GitHub icon]` linking to `https://github.com/hulryung/claude-made-me-do-it`

Muted text, small font.

## 3. Behavior

### 3.1 Theme toggle

- Default: follows OS via `prefers-color-scheme`.
- On toggle click: stores the chosen mode in `localStorage` under key `theme` (values: `"light"` | `"dark"`).
- On page load: read `localStorage.theme`. If absent, follow OS. If present, apply it (and listen for OS changes only when no override is set).
- Implementation: set `data-theme="light"` or `data-theme="dark"` on `<html>`. CSS variables are scoped:
  ```css
  :root { /* light defaults */ }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { /* dark vars */ }
  }
  :root[data-theme="dark"] { /* dark vars */ }
  ```
  This way OS-driven dark mode applies unless the user has explicitly chosen `light`, and vice versa.
- When an override is active, a small `Reset` link is appended to (not replacing) the "Follows your OS by default." caption. Clicking it removes the `localStorage` entry, removes the `data-theme` attribute, and hides itself.

### 3.2 Live update pipeline (input → output)

On every `input` event of the input textarea:

1. Read raw value.
2. Update input panel's line-numbers and ws-overlay.
3. Call `cleanText(raw)`.
4. Write `result.text` into the output textarea's value.
5. Update output panel's line-numbers and ws-overlay (mirroring the new output value).
6. Update the three stats tiles (`Lines`, `Removed common indent`, `Trailing spaces trimmed`).

Stats helpers:
- `Lines` = `result.stats.linesOut`.
- `Removed common indent` = `describePrefix(result.stats.prefixRemoved)` (existing helper, reused).
- `Trailing spaces trimmed` = derived: scan input lines for any trailing `[ \t]+` and check whether at least one was stripped (i.e., output differs from raw with respect to trailing whitespace). Display `✓` or `—`.

### 3.3 Copy button

Same logic as the current implementation — see §2.4. Visual styling adapts to the new panel-header location.

### 3.4 Scroll synchronization

When the input or output textarea fires a `scroll` event, set `scrollTop` (and `scrollLeft` for horizontal scroll if any) on the corresponding ws-overlay and line-numbers gutter.

### 3.5 Responsive layout

- ≥ 768px: as drawn in §2.1.
- < 768px:
  - Header switches to a centered single-column layout. Theme toggle moves below the tagline.
  - Feature badges stack vertically, full-width.
  - Code panels stack vertically; arrow rotates 90°.
  - Supporting cards stack vertically.
  - Stats: metrics on the first row (still horizontal, smaller); info box on a second row.
  - Footer: three slots stack vertically.

## 4. Files & Implementation

### 4.1 File structure (unchanged)

```
claude-made-me-do-it/
├── index.html      # complete rewrite (head, body, inline CSS, inline JS)
├── clean.js        # unchanged
├── tests.html      # unchanged
├── README.md       # not required to change for v1; possible screenshot update later
├── .gitignore
├── .nojekyll
└── docs/
    └── superpowers/
        ├── specs/
        │   ├── 2026-04-29-paste-cleaner-design.md   # original spec (algorithm authoritative)
        │   └── 2026-04-29-ui-redesign-design.md     # this file
        └── plans/
            ├── 2026-04-29-claude-made-me-do-it.md   # original implementation plan (already executed)
            └── 2026-04-29-ui-redesign-plan.md       # implementation plan for this redesign (next step)
```

### 4.2 Inside `index.html`

- `<head>`: meta, `<link>` to Google Fonts (`Caveat` for the title; `Inter` for the body), inline `<style>`.
- `<body>`: header → feature badges → main (two code panels + supporting cards) → stats footer → page footer.
- End of body: inline `<script>` containing:
  - The existing wiring (`render`, `describePrefix`, `copyOutput`, focus handler) — adapted to the new DOM ids/classes.
  - New helpers:
    - `updateOverlay(textarea, overlayEl)` — rewrites the overlay's content with `·`/`→` substitutions for leading whitespace.
    - `updateLineNumbers(textarea, gutterEl)` — updates the gutter content.
    - `syncScroll(textarea, ...mirrors)` — sets `scrollTop`/`scrollLeft` on overlay + gutter.
    - `applyTheme(mode)` — sets `data-theme` and updates the toggle's active state.
    - `loadTheme()` — reads `localStorage.theme` and applies it on load; wires up the toggle and reset link.

### 4.3 Migration approach

A single full rewrite of `index.html`. No partial migration — partial states would look broken. Subagents will implement the redesign in small batches (header, code panels with overlay, supporting cards, stats/footer, theme toggle, polish) and the implementation plan will detail the order.

`clean.js` and `tests.html` are not touched. The 19-assertion test page continues to verify the algorithm is unaffected.

### 4.4 Test plan

- `tests.html` continues to verify the algorithm. No new automated tests for the UI.
- Manual smoke test (after final implementation):
  - Paste a 5-line bash block with 2-space common indent: confirm output strips it, line numbers and dots align, stats show correct values.
  - Verify whitespace dot rendering: dots align exactly with leading spaces; no offset.
  - Verify scroll sync: scrolling the textarea moves overlay and gutter together.
  - Verify scrollbar position: textarea's scrollbar is visible and operates normally.
  - Click `Copy`: shows `Copied!` for ~1.5s, clipboard contains the cleaned text.
  - Toggle theme: light → dark → reload → state persists. Click "Reset to OS" → state follows OS.
  - Resize to < 768px: layout stacks as specified.
  - In a private window with `prefers-color-scheme: dark`, page loads in dark mode.

### 4.5 Risks

- **Overlay/textarea pixel alignment.** Any difference in font, font-size, line-height, padding, or `letter-spacing` between the overlay `<pre>` and the textarea will misalign the dots. Mitigation: identical CSS rules; visual check during implementation.
- **Scroll-sync drift on momentum scrolling (iOS).** iOS Safari may emit fewer `scroll` events under flick gestures. Mitigation: also sync on `touchend` if drift is observed.
- **Line-number gutter width jump.** Single-digit → double-digit transitions can cause a 1ch layout shift. Mitigation: `min-width: 2.5em` from the start.
- **Google Fonts blocking render.** A failed/slow font fetch could block paint. Mitigation: `font-display: swap` in the Google Fonts URL parameter.

## 5. Out of Scope (YAGNI)

The following are intentionally **not** included in this redesign:

- Korean (or any non-English) UI copy. Tracked as a future task.
- Syntax highlighting in the code panels. Considered and explicitly dropped to preserve the no-CDN-script constraint.
- A full code-editor library (CodeMirror, Monaco). Same reason.
- Snippet history or save/share features.
- A diff view between input and output.
- Configuration UI for the algorithm (custom prefix length, ignore-comment lines, etc.).
- Any server-side component.
