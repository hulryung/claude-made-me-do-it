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
4. If the first or last non-empty line has zero leading whitespace while every other line has some, exclude it from the prefix calculation (likely a partial copy from mid-line).
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
