# Paste Cleaner — Design Doc

**Date:** 2026-04-29
**Author:** dkkang
**Status:** Approved (pending implementation)

## 1. Overview

A single-page static web app that removes **common leading whitespace** and **trailing whitespace** from pasted text, then makes the cleaned result easy to copy back. Aimed at the friction of copying code blocks or shell commands from AI tools (Claude Code, ChatGPT, etc.) where output often arrives with consistent extra indentation that breaks when pasted into a terminal or editor.

**Core principles:**

- Single `index.html` with HTML, CSS, and JS all inline.
- No external dependencies, no build step, no server.
- All processing is client-side; pasted text never leaves the browser.
- Hosted on GitHub Pages.

**Why this exists (vs. existing tools):**

Existing online tools fall into two camps:

1. *Strip-everything* tools (Browserling, MiniWebtool "Remove All Whitespace") — too aggressive; destroy code structure.
2. *Per-line trim* tools (MiniWebtool "Remove Leading/Trailing", CodeShack) — also destroy code indentation by removing leading whitespace from every line independently.

Neither preserves *relative* indentation. This tool implements `textwrap.dedent`-style behavior (remove only the common leading whitespace) in a paste-friendly UI, with a small smart-exception for partial-copy artifacts.

## 2. Algorithm

```
Input: raw text (the pasted string)

1. Split into lines (handle LF and CRLF; normalize line endings).
2. Strip trailing whitespace from each line.
3. Pick dedent candidates:
   - Start with all non-empty lines.
   - If the FIRST line's leading-whitespace length is less than
     the minimum among the other non-empty lines, exclude it.
   - Same check for the LAST line.
   (This handles the "partial copy" case where the user grabbed
    a line mid-stream so its indentation is artificially short.)
4. Compute the longest common prefix of the leading-whitespace
   strings of the candidate lines (prefix-matching, not just
   length — protects against tab/space mixing).
5. Remove that prefix from every line in the output.
   - Lines that share the prefix get it stripped.
   - Excluded lines (first/last partial) keep their content;
     the prefix is stripped only if their leading whitespace
     starts with it.
6. Trim leading and trailing empty lines from the result.

Output: { text, stats: { linesIn, linesOut, prefixRemoved } }
```

**Edge cases:**

| Case | Behavior |
|---|---|
| Empty input | Empty output, stats zeroed. |
| Single non-empty line | Trailing-whitespace strip only; no dedent. |
| All lines empty | Empty output. |
| Common prefix is empty | No dedent step (output = trailing-trimmed input with leading/trailing blank lines removed). |
| Mixed tabs and spaces in leading | Prefix matching naturally handles this — only the literal common run is removed. |

## 3. UI

**Desktop layout (≥ 768px):**

```
┌──────────────────────────────────────────────────┐
│  Paste Cleaner                                   │
├──────────────────────────────────────────────────┤
│ ┌────────────────────┬────────────────────────┐  │
│ │ INPUT              │ OUTPUT       [Copy]    │  │
│ │ (textarea)         │ (textarea, readonly)   │  │
│ │                    │                        │  │
│ │ paste here…        │ cleaned result…        │  │
│ │                    │                        │  │
│ └────────────────────┴────────────────────────┘  │
│  Lines: 12   Removed: 2 leading spaces           │
└──────────────────────────────────────────────────┘
```

**Mobile layout (< 768px):** stacked vertically, input on top, output below.

**Behavior:**

- Output updates immediately on every input change. No debounce required (operation is cheap; even 10k lines complete in milliseconds).
- "Copy" button calls `navigator.clipboard.writeText()` and shows a brief toast / inline label change (e.g., "Copied!" for ~1.5s).
- Clicking the output textarea selects-all as a fallback.
- Empty input state shows placeholder text in both panes.

**Styling:**

- Light/dark via `prefers-color-scheme` media query.
- Monospace font (system stack: `ui-monospace, SF Mono, Consolas, monospace`).
- Mostly neutral grayscale; one accent color for the Copy button.
- All CSS inline in `<style>` in `<head>`.

## 4. File Structure & Deployment

**Repository layout:**

```
paste/
├── index.html      # HTML + inline <style> + inline <script>
├── README.md       # Project intro, usage, deploy notes
├── .gitignore
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-29-paste-cleaner-design.md   # this file
```

**index.html structure:**

- `<head>`: meta, title, inline `<style>`.
- `<body>`: header, two-pane main, stats footer.
- End of body: inline `<script>` exposing:
  - `cleanText(raw: string): { text: string, stats: { linesIn, linesOut, prefixRemoved } }` — pure function, attached to `window` for ad-hoc testing in the console.
  - DOM event wiring (input event on the source textarea, click on Copy).

**Testing:**

- No build pipeline, no test framework.
- `cleanText` is a pure function; verifiable by typing test cases into the browser console (`window.cleanText(...)`).
- A small set of representative cases is included as comments in the source for reference.

**GitHub Pages deployment:**

1. `git init` locally; first commit.
2. Create GitHub repo, push.
3. Settings → Pages → Source: `main` branch, `/ (root)` → Save.
4. Site available at `https://<user>.github.io/<repo>/`.

## 5. Out of Scope (YAGNI)

The following are intentionally **not** included in v1:

- History of past pastes / saved snippets.
- URL sharing of cleaned output.
- Diff view between input and output.
- Configurable rules (custom prefix length, tab-width, etc.).
- Server-side anything.
- Build tooling, framework, package.json.

If demand arises, these can be added later by migrating to a Vite + Vanilla TS setup without changing the algorithm contract.
