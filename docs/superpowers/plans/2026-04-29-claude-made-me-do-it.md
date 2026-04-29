# claude-made-me-do-it Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page static web app that strips common leading whitespace and trailing whitespace from pasted text and lets the user copy the cleaned result back, deployable to GitHub Pages with no build step.

**Architecture:** A single `index.html` with inline CSS and inline JavaScript. The whitespace algorithm is implemented as a pure function `cleanText(raw)` exposed on `window` so it can be exercised from the browser console. Two textareas (input + output) plus a Copy button form the UI. No frameworks, no bundler, no server. Tests live in a separate `tests.html` page that loads `cleanText` from the same source and runs assertions in the browser.

**Tech Stack:** HTML5, CSS (system fonts, `prefers-color-scheme`), vanilla JavaScript (no modules, no dependencies). `navigator.clipboard` for copy. Git + GitHub Pages for deployment.

**Spec reference:** `docs/superpowers/plans/../specs/2026-04-29-paste-cleaner-design.md`

---

## File Structure

| File | Purpose |
|---|---|
| `index.html` | The app. Inline `<style>` and `<script>`. Holds the UI and wires `cleanText` into events. |
| `tests.html` | A standalone browser page that loads the algorithm and runs assertion-based tests, printing pass/fail to the page and the console. Not deployed (or deployed as a curiosity at `/tests.html`). |
| `README.md` | What it is, how to run locally, how to deploy to GitHub Pages. |
| `.gitignore` | Ignore OS junk and editor files. |
| `.nojekyll` | Empty file telling GitHub Pages not to run Jekyll. |

To keep `cleanText` reusable across `index.html` and `tests.html` without a build step, we extract it into a separate file `clean.js` referenced by both pages with `<script src="clean.js"></script>`. This is the only structural decomposition.

Final layout:

```
claude-made-me-do-it/
├── index.html
├── tests.html
├── clean.js
├── README.md
├── .gitignore
└── .nojekyll
```

---

## Task 1: Repo skeleton and ignore files

**Files:**
- Create: `.gitignore`
- Create: `.nojekyll`

- [ ] **Step 1: Create `.gitignore`**

Write the file with this content:

```
.DS_Store
*.swp
*.swo
.idea/
.vscode/
node_modules/
```

- [ ] **Step 2: Create `.nojekyll`**

Write an empty file at `.nojekyll`. This prevents GitHub Pages from running Jekyll, which would otherwise ignore files starting with underscores.

- [ ] **Step 3: Verify files exist**

Run: `ls -la .gitignore .nojekyll`
Expected: both files listed; `.nojekyll` has size 0.

- [ ] **Step 4: Commit**

```bash
git add .gitignore .nojekyll
git -c commit.gpgsign=false commit -m "chore: add gitignore and nojekyll for github pages"
```

---

## Task 2: Algorithm — split into lines and strip trailing whitespace

This is the first slice of the algorithm. We build `cleanText` incrementally with a test page driving each step.

**Files:**
- Create: `clean.js`
- Create: `tests.html`

- [ ] **Step 1: Create `tests.html` with the test runner**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>cleanText tests</title>
  <style>
    body { font-family: ui-monospace, SF Mono, Consolas, monospace; padding: 1rem; }
    .pass { color: #0a7d2c; }
    .fail { color: #c0392b; font-weight: bold; }
    pre { background: #f4f4f4; padding: 0.5rem; white-space: pre-wrap; }
  </style>
</head>
<body>
<h1>cleanText tests</h1>
<div id="results"></div>
<script src="clean.js"></script>
<script>
  const results = document.getElementById('results');
  let failed = 0, passed = 0;

  function assertEqual(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    const div = document.createElement('div');
    div.className = ok ? 'pass' : 'fail';
    div.textContent = (ok ? 'PASS: ' : 'FAIL: ') + name;
    results.appendChild(div);
    if (!ok) {
      const pre = document.createElement('pre');
      pre.textContent =
        'expected: ' + JSON.stringify(expected, null, 2) +
        '\nactual:   ' + JSON.stringify(actual, null, 2);
      results.appendChild(pre);
      failed++;
      console.error('FAIL', name, { expected, actual });
    } else {
      passed++;
    }
  }

  // ---- tests below this line ----

  assertEqual(
    'strips trailing whitespace from each line',
    cleanText('abc   \ndef\t\nghi').text,
    'abc\ndef\nghi'
  );

  // ---- summary ----
  const summary = document.createElement('h2');
  summary.textContent = `${passed} passed, ${failed} failed`;
  summary.className = failed ? 'fail' : 'pass';
  results.appendChild(summary);
</script>
</body>
</html>
```

- [ ] **Step 2: Open `tests.html` to confirm test fails**

Run: `open tests.html` (macOS) — opens in default browser.
Expected: a red "FAIL" line because `cleanText` is not defined; the page shows `cleanText is not defined` in the console.

- [ ] **Step 3: Create `clean.js` with minimal `cleanText`**

```javascript
// claude-made-me-do-it — whitespace cleaner
// Pure function. Exposed on window for console testing.

(function (root) {
  function cleanText(raw) {
    if (typeof raw !== 'string') raw = '';

    // Normalize line endings, then split.
    const lines = raw.replace(/\r\n?/g, '\n').split('\n');

    // Strip trailing whitespace from each line.
    const trimmed = lines.map(function (line) {
      return line.replace(/[ \t]+$/, '');
    });

    return {
      text: trimmed.join('\n'),
      stats: {
        linesIn: lines.length,
        linesOut: trimmed.length,
        prefixRemoved: ''
      }
    };
  }

  root.cleanText = cleanText;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Reload `tests.html`**

Expected: one green "PASS: strips trailing whitespace from each line", and `1 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add clean.js tests.html
git -c commit.gpgsign=false commit -m "feat: cleanText skeleton with trailing-whitespace stripping"
```

---

## Task 3: Algorithm — common leading-whitespace prefix detection

**Files:**
- Modify: `tests.html` (add tests)
- Modify: `clean.js` (extend `cleanText`)

- [ ] **Step 1: Add failing tests for prefix detection**

Insert these `assertEqual` calls in `tests.html`, just after the existing one and before the `// ---- summary ----` line:

```javascript
  assertEqual(
    'removes 2-space common leading prefix',
    cleanText('  echo "a"\n  echo "b"').text,
    'echo "a"\necho "b"'
  );

  assertEqual(
    'preserves relative indentation',
    cleanText('  outer\n    inner\n  outer').text,
    'outer\n  inner\nouter'
  );

  assertEqual(
    'no dedent when prefix is empty',
    cleanText('a\n  b').text,
    'a\n  b'
  );

  assertEqual(
    'mixed tabs and spaces — only literal common prefix removed',
    cleanText('\t a\n\t b').text,
    'a\nb'
  );

  assertEqual(
    'mixed tabs vs spaces in different lines — no common prefix',
    cleanText('\ta\n  a').text,
    '\ta\n  a'
  );

  assertEqual(
    'reports prefixRemoved in stats',
    cleanText('  a\n  b').stats.prefixRemoved,
    '  '
  );
```

- [ ] **Step 2: Reload `tests.html` to confirm new tests fail**

Expected: the new "removes 2-space common leading prefix" and most subsequent tests fail (they will all show "  echo..." unchanged because dedent isn't implemented yet).

- [ ] **Step 3: Implement prefix detection and removal**

Replace the body of `cleanText` in `clean.js` with this expanded version (keep the IIFE wrapper unchanged):

```javascript
  function leadingWhitespace(line) {
    const m = line.match(/^[ \t]*/);
    return m ? m[0] : '';
  }

  function commonPrefix(a, b) {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++;
    return a.slice(0, i);
  }

  function cleanText(raw) {
    if (typeof raw !== 'string') raw = '';

    const linesIn = raw.replace(/\r\n?/g, '\n').split('\n');

    // Step: trailing-whitespace strip.
    const trimmed = linesIn.map(function (line) {
      return line.replace(/[ \t]+$/, '');
    });

    // Step: dedent — find longest common leading-whitespace prefix
    // among all non-empty lines.
    const nonEmpty = trimmed.filter(function (line) { return line.length > 0; });

    let prefix = null;
    for (let i = 0; i < nonEmpty.length; i++) {
      const lw = leadingWhitespace(nonEmpty[i]);
      prefix = (prefix === null) ? lw : commonPrefix(prefix, lw);
      if (prefix === '') break;
    }
    if (prefix === null) prefix = '';

    const dedented = trimmed.map(function (line) {
      if (line.length === 0) return line;
      return line.startsWith(prefix) ? line.slice(prefix.length) : line;
    });

    return {
      text: dedented.join('\n'),
      stats: {
        linesIn: linesIn.length,
        linesOut: dedented.length,
        prefixRemoved: prefix
      }
    };
  }
```

- [ ] **Step 4: Reload `tests.html`**

Expected: all 7 tests pass, `7 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add clean.js tests.html
git -c commit.gpgsign=false commit -m "feat: longest-common-prefix dedent in cleanText"
```

---

## Task 4: Algorithm — smart exception for partial-copy first/last line

**Files:**
- Modify: `tests.html` (add tests)
- Modify: `clean.js` (refine candidate selection)

- [ ] **Step 1: Add failing tests for smart exception**

Insert these into `tests.html` before the summary block:

```javascript
  assertEqual(
    'first-line outlier excluded from prefix calculation',
    cleanText('partial mid-stream\n  echo a\n  echo b').text,
    'partial mid-stream\necho a\necho b'
  );

  assertEqual(
    'last-line outlier excluded from prefix calculation',
    cleanText('  echo a\n  echo b\nstrayed end').text,
    'echo a\necho b\nstrayed end'
  );

  assertEqual(
    'first AND last outliers both excluded',
    cleanText('strayed start\n  echo a\n  echo b\nstrayed end').text,
    'strayed start\necho a\necho b\nstrayed end'
  );

  assertEqual(
    'single non-empty line: no exclusion, just trailing trim',
    cleanText('  only line').text,
    '  only line'
  );

  assertEqual(
    'two non-empty lines, first shorter: first excluded so prefix from second alone',
    cleanText('a\n  b').text,
    'a\nb'
  );
```

- [ ] **Step 2: Reload `tests.html` to confirm new tests fail**

Expected: most of the new tests fail because the current implementation includes outlier first/last lines in the prefix calculation, causing the prefix to collapse to `""`.

- [ ] **Step 3: Refine candidate selection in `clean.js`**

Replace the dedent block (the part starting at `// Step: dedent — ...` through `prefixRemoved: prefix`) with this:

```javascript
    // Step: dedent.
    // Identify non-empty lines and their indices.
    const nonEmptyIdx = [];
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i].length > 0) nonEmptyIdx.push(i);
    }

    let prefix = '';
    if (nonEmptyIdx.length === 1) {
      // Single non-empty line: no dedent (per spec edge case).
      prefix = '';
    } else if (nonEmptyIdx.length >= 2) {
      // Compute M = min leading-whitespace length over all non-empty lines.
      let minLen = Infinity;
      for (let k = 0; k < nonEmptyIdx.length; k++) {
        const lw = leadingWhitespace(trimmed[nonEmptyIdx[k]]);
        if (lw.length < minLen) minLen = lw.length;
      }

      const firstIdx = nonEmptyIdx[0];
      const lastIdx = nonEmptyIdx[nonEmptyIdx.length - 1];
      const firstLW = leadingWhitespace(trimmed[firstIdx]);
      const lastLW = leadingWhitespace(trimmed[lastIdx]);

      const excludeFirst = firstLW.length < minLen;
      const excludeLast = lastLW.length < minLen;

      // Build the candidate set after exclusion.
      const candidates = [];
      for (let k = 0; k < nonEmptyIdx.length; k++) {
        const idx = nonEmptyIdx[k];
        if (excludeFirst && idx === firstIdx) continue;
        if (excludeLast && idx === lastIdx) continue;
        candidates.push(trimmed[idx]);
      }

      if (candidates.length === 0) {
        prefix = '';
      } else {
        let p = null;
        for (let k = 0; k < candidates.length; k++) {
          const lw = leadingWhitespace(candidates[k]);
          p = (p === null) ? lw : commonPrefix(p, lw);
          if (p === '') break;
        }
        prefix = p === null ? '' : p;
      }
    }

    const dedented = trimmed.map(function (line) {
      if (line.length === 0) return line;
      return line.startsWith(prefix) ? line.slice(prefix.length) : line;
    });
```

Note: the `return { text: ..., stats: { ... } };` block stays the same.

- [ ] **Step 4: Reload `tests.html`**

Expected: all tests so far pass (12+ passed, 0 failed).

- [ ] **Step 5: Commit**

```bash
git add clean.js tests.html
git -c commit.gpgsign=false commit -m "feat: exclude first/last partial-copy outliers from dedent"
```

---

## Task 5: Algorithm — trim leading/trailing blank lines

**Files:**
- Modify: `tests.html` (add tests)
- Modify: `clean.js` (final pass)

- [ ] **Step 1: Add failing tests**

Insert into `tests.html` before the summary:

```javascript
  assertEqual(
    'leading blank lines trimmed',
    cleanText('\n\n  a\n  b').text,
    'a\nb'
  );

  assertEqual(
    'trailing blank lines trimmed',
    cleanText('  a\n  b\n\n').text,
    'a\nb'
  );

  assertEqual(
    'blank lines in the middle preserved',
    cleanText('  a\n\n  b').text,
    'a\n\nb'
  );

  assertEqual(
    'empty input produces empty output',
    cleanText('').text,
    ''
  );

  assertEqual(
    'whitespace-only input produces empty output',
    cleanText('   \n\t\n').text,
    ''
  );
```

- [ ] **Step 2: Reload `tests.html` to confirm new tests fail**

Expected: the leading/trailing blank-line tests fail because the current implementation keeps the blank lines.

- [ ] **Step 3: Add the trim-empty-edges pass**

In `clean.js`, between the `const dedented = trimmed.map(...)` block and the `return { text: ..., stats: { ... } };` block, insert:

```javascript
    // Step: trim leading/trailing blank lines.
    let start = 0;
    let end = dedented.length;
    while (start < end && dedented[start].length === 0) start++;
    while (end > start && dedented[end - 1].length === 0) end--;
    const finalLines = dedented.slice(start, end);
```

Then change the `return` statement from:

```javascript
    return {
      text: dedented.join('\n'),
      stats: {
        linesIn: linesIn.length,
        linesOut: dedented.length,
        prefixRemoved: prefix
      }
    };
```

to:

```javascript
    return {
      text: finalLines.join('\n'),
      stats: {
        linesIn: linesIn.length,
        linesOut: finalLines.length,
        prefixRemoved: prefix
      }
    };
```

- [ ] **Step 4: Reload `tests.html`**

Expected: all tests pass (17+ passed, 0 failed).

- [ ] **Step 5: Commit**

```bash
git add clean.js tests.html
git -c commit.gpgsign=false commit -m "feat: trim leading and trailing blank lines"
```

---

## Task 6: Algorithm — realistic Claude Code paste regression test

This task adds a single end-to-end regression test based on the exact case the user provided during brainstorming, to lock the behavior in.

**Files:**
- Modify: `tests.html`

- [ ] **Step 1: Add the regression test**

Insert into `tests.html` before the summary block:

```javascript
  // Regression: real-world paste from Claude Code (2-space indented bash block).
  {
    const input =
      '  echo "=== EP inbound ATR (BAR0~5) ==="\n' +
      '  for w in 0 1 2 3 4 5; do\n' +
      '      base=$((0x20050600 + $w * 0x100))\n' +
      '      printf "WIN%d @0x%x:\\n" $w $base\n' +
      '  done\n' +
      '\n' +
      '  echo\n' +
      '  echo "=== set_bar 시 driver 출력 (ATR 설정) ==="';

    const expected =
      'echo "=== EP inbound ATR (BAR0~5) ==="\n' +
      'for w in 0 1 2 3 4 5; do\n' +
      '    base=$((0x20050600 + $w * 0x100))\n' +
      '    printf "WIN%d @0x%x:\\n" $w $base\n' +
      'done\n' +
      '\n' +
      'echo\n' +
      'echo "=== set_bar 시 driver 출력 (ATR 설정) ==="';

    assertEqual('regression: claude-code 2-space indent block', cleanText(input).text, expected);
    assertEqual('regression: prefix detected as two spaces', cleanText(input).stats.prefixRemoved, '  ');
  }
```

- [ ] **Step 2: Reload `tests.html`**

Expected: all tests pass (19+ passed, 0 failed). If this regression fails, the implementation is wrong — fix `clean.js`, do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add tests.html
git -c commit.gpgsign=false commit -m "test: regression for real-world claude-code paste"
```

---

## Task 7: UI — index.html skeleton (markup only)

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html` with structural markup**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude-made-me-do-it</title>
</head>
<body>
  <header>
    <h1>claude-made-me-do-it</h1>
    <p class="tagline">Paste from Claude Code or any AI tool. Get clean, copy-ready text.</p>
  </header>

  <main>
    <section class="pane pane-input">
      <label for="input">Input</label>
      <textarea
        id="input"
        spellcheck="false"
        autocomplete="off"
        placeholder="Paste here…"></textarea>
    </section>

    <section class="pane pane-output">
      <div class="pane-header">
        <label for="output">Output</label>
        <button id="copy" type="button">Copy</button>
      </div>
      <textarea
        id="output"
        spellcheck="false"
        autocomplete="off"
        readonly
        placeholder="Cleaned result will appear here."></textarea>
    </section>
  </main>

  <footer>
    <span id="stats"></span>
  </footer>

  <script src="clean.js"></script>
  <script>
    // wiring goes here in Task 9
  </script>
</body>
</html>
```

- [ ] **Step 2: Open in browser to verify markup renders**

Run: `open index.html`
Expected: an unstyled but functional page with title, a textarea labeled "Input", a textarea labeled "Output", and a "Copy" button. No errors in console.

- [ ] **Step 3: Commit**

```bash
git add index.html
git -c commit.gpgsign=false commit -m "feat: index.html structural markup"
```

---

## Task 8: UI — styling

**Files:**
- Modify: `index.html` (add `<style>` in `<head>`)

- [ ] **Step 1: Add inline styles**

In `index.html`, replace the empty `<head>` between `<title>` and `</head>` to insert a `<style>` block. The full `<head>` should look like this:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude-made-me-do-it</title>
  <style>
    :root {
      --bg: #ffffff;
      --fg: #1a1a1a;
      --muted: #666;
      --border: #d0d0d0;
      --pane-bg: #fafafa;
      --accent: #2563eb;
      --accent-fg: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1115;
        --fg: #e6e6e6;
        --muted: #888;
        --border: #2a2d33;
        --pane-bg: #15181d;
        --accent: #3b82f6;
        --accent-fg: #ffffff;
      }
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 1rem 1.25rem 0.5rem;
    }
    h1 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .tagline {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.85rem;
    }

    main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem 0.5rem;
      min-height: 0;
    }
    @media (max-width: 768px) {
      main { grid-template-columns: 1fr; }
    }

    .pane {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--pane-bg);
      min-height: 0;
    }
    .pane label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      padding: 0.5rem 0.75rem;
    }
    .pane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 0.5rem;
    }
    .pane textarea {
      flex: 1;
      width: 100%;
      border: 0;
      outline: 0;
      resize: none;
      background: transparent;
      color: var(--fg);
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      padding: 0 0.75rem 0.75rem;
      tab-size: 4;
    }
    .pane textarea::placeholder {
      color: var(--muted);
    }

    button#copy {
      background: var(--accent);
      color: var(--accent-fg);
      border: 0;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      margin: 0.25rem 0;
    }
    button#copy:active { transform: translateY(1px); }
    button#copy.copied { background: #16a34a; }

    footer {
      padding: 0.5rem 1.25rem 0.75rem;
      color: var(--muted);
      font-size: 0.75rem;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }
  </style>
</head>
```

- [ ] **Step 2: Reload `index.html` in the browser**

Expected: two side-by-side panes on desktop, stacked vertically when the window is narrower than 768px. Light theme by default; dark theme automatically when the OS is set to dark mode. The Copy button is colored.

- [ ] **Step 3: Commit**

```bash
git add index.html
git -c commit.gpgsign=false commit -m "feat: index.html styling with light/dark themes"
```

---

## Task 9: UI — wire input → cleanText → output and Copy button

**Files:**
- Modify: `index.html` (the `<script>` block at the bottom)

- [ ] **Step 1: Replace the placeholder script with the wiring**

Replace this block in `index.html`:

```html
  <script>
    // wiring goes here in Task 9
  </script>
```

with:

```html
  <script>
    (function () {
      const inputEl = document.getElementById('input');
      const outputEl = document.getElementById('output');
      const copyBtn = document.getElementById('copy');
      const statsEl = document.getElementById('stats');

      function render() {
        const result = cleanText(inputEl.value);
        outputEl.value = result.text;
        const prefixDesc = describePrefix(result.stats.prefixRemoved);
        statsEl.textContent =
          'Lines: ' + result.stats.linesOut +
          '   Removed: ' + prefixDesc;
      }

      function describePrefix(p) {
        if (!p) return 'no common leading whitespace';
        let spaces = 0, tabs = 0;
        for (let i = 0; i < p.length; i++) {
          if (p[i] === ' ') spaces++;
          else if (p[i] === '\t') tabs++;
        }
        const parts = [];
        if (spaces) parts.push(spaces + ' space' + (spaces === 1 ? '' : 's'));
        if (tabs) parts.push(tabs + ' tab' + (tabs === 1 ? '' : 's'));
        return parts.join(' + ') + ' leading';
      }

      async function copyOutput() {
        try {
          await navigator.clipboard.writeText(outputEl.value);
        } catch (err) {
          // Fallback: select and execCommand for older browsers.
          outputEl.removeAttribute('readonly');
          outputEl.select();
          document.execCommand('copy');
          outputEl.setAttribute('readonly', '');
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove('copied');
        }, 1500);
      }

      inputEl.addEventListener('input', render);
      copyBtn.addEventListener('click', copyOutput);

      // Click the output to select-all (handy fallback).
      outputEl.addEventListener('focus', function () { outputEl.select(); });

      render();
    })();
  </script>
```

- [ ] **Step 2: Reload and test interactively**

Open `index.html`. Paste this into the input textarea:

```
  echo "hello"
  echo "world"
```

Expected:
- Output textarea shows:
  ```
  echo "hello"
  echo "world"
  ```
  (no leading 2 spaces)
- Footer shows: `Lines: 2   Removed: 2 spaces leading`

Click "Copy". Expected: button briefly turns green and reads "Copied!", then reverts. Paste into another app to confirm the cleaned text is on the clipboard.

- [ ] **Step 3: Test the empty case**

Clear the input. Expected: output is empty; footer reads `Lines: 0   Removed: no common leading whitespace`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git -c commit.gpgsign=false commit -m "feat: wire input/output/copy with live stats"
```

---

## Task 10: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

```markdown
# claude-made-me-do-it

A web app I made because Claude Code's copy-paste keeps breaking my terminal.

When you copy a code block or shell command from Claude Code (or ChatGPT, or any chat-style AI tool), the output usually arrives with a couple of leading spaces in front of every line. Pasting that straight into a terminal or editor often breaks indentation-sensitive code, or worse, refuses to run.

This page strips the **common** leading whitespace (so the relative indentation of code is preserved) and trims trailing whitespace per line. Paste in, copy out, get on with your day.

## Usage

Open the deployed page (or `index.html` locally), paste into the left pane, copy from the right pane.

The algorithm:

1. Normalize line endings, split into lines.
2. Strip trailing whitespace from each line.
3. Find the longest common leading-whitespace prefix among non-empty lines.
4. If the first or last non-empty line is shorter than the rest (likely a partial copy), exclude it from the prefix calculation.
5. Strip that prefix from every line.
6. Trim leading and trailing blank lines.

Everything happens in the browser. No text is ever sent anywhere.

## Run locally

```sh
open index.html        # macOS
xdg-open index.html    # Linux
```

Or just double-click `index.html`.

## Tests

Open `tests.html` in a browser. Pass/fail counts print on the page and to the console.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Source: `main`, folder `/ (root)` → Save.
3. The site appears at `https://<user>.github.io/claude-made-me-do-it/`.

The included `.nojekyll` file disables Jekyll, so files like `_anything` would be served as-is (we have none, but it's harmless and future-proof).
```

- [ ] **Step 2: Verify it renders sensibly**

Run: `cat README.md | head -20` to eyeball formatting.
Expected: section headers and code fences look right.

- [ ] **Step 3: Commit**

```bash
git add README.md
git -c commit.gpgsign=false commit -m "docs: add README"
```

---

## Task 11: Final manual smoke test

**Files:** none modified.

- [ ] **Step 1: Run the test page**

`open tests.html`. Confirm: the summary at the bottom is green and reads `N passed, 0 failed` where N matches the number of `assertEqual` calls (should be ~19).

- [ ] **Step 2: Manually exercise `index.html` with the canonical paste**

`open index.html`. Paste exactly:

```
  echo "=== EP inbound ATR (BAR0~5) ==="
  for w in 0 1 2 3 4 5; do
      base=$((0x20050600 + $w * 0x100))
      printf "WIN%d @0x%x:\n" $w $base
  done
```

Expected output in the right pane:

```
echo "=== EP inbound ATR (BAR0~5) ==="
for w in 0 1 2 3 4 5; do
    base=$((0x20050600 + $w * 0x100))
    printf "WIN%d @0x%x:\n" $w $base
done
```

Footer: `Lines: 5   Removed: 2 spaces leading`.

Click Copy. Paste into any other text field to confirm the clipboard content matches.

- [ ] **Step 3: Resize the window narrower than ~768px**

Expected: panes stack vertically, input on top, output below. Everything still functional.

- [ ] **Step 4: (If a dark mode toggle is available on your OS) verify dark theme**

Switch OS appearance to dark mode. Reload the page. Expected: dark background, light text, button still readable.

- [ ] **Step 5: No commit needed**

This is verification only.

---

## Task 12: Push to GitHub Pages (manual / out of band)

This step is intentionally not automated — creating a GitHub repository is a user-confirming action.

- [ ] **Step 1: Pause and ask the user**

Before pushing, confirm with the user:
- The GitHub username/org to push under.
- Whether the repo should be public (default for Pages) or private (Pages requires Pro/Enterprise to serve from private).

- [ ] **Step 2: User creates the GitHub repo named `claude-made-me-do-it` and provides the remote URL**

- [ ] **Step 3: Add remote and push**

```bash
git remote add origin <url-from-user>
git branch -M main
git push -u origin main
```

- [ ] **Step 4: User enables Pages in repo settings**

Settings → Pages → Source: `main` / `/ (root)` → Save. Wait ~1 minute, then visit `https://<user>.github.io/claude-made-me-do-it/`.

- [ ] **Step 5: Smoke test the deployed site**

Repeat Task 11 Step 2 against the live URL. Confirm the canonical paste case works on the deployed page.

---

## Self-Review Notes

- **Spec coverage:** Every section of the spec is covered. §1 overview → README + Task 7 markup. §2 algorithm → Tasks 2–6 (incremental TDD). §3 UI → Tasks 7–9. §4 file structure & deployment → Tasks 1, 10, 12. §5 out-of-scope items are not tasked (correct).
- **Placeholder scan:** No TBD/TODO. Each code step has the actual code. Manual tests have explicit expected output.
- **Type / name consistency:** `cleanText(raw) → { text, stats: { linesIn, linesOut, prefixRemoved } }` is consistent across Tasks 2, 3, 4, 5, and 9. Helper names `leadingWhitespace`, `commonPrefix` introduced in Task 3 and reused in Task 4.
- **Test isolation:** Each algorithm task adds tests *first*, runs the page to confirm failure, then implements. Earlier tests stay in `tests.html` and continue to be exercised on every reload — this catches regressions automatically.
