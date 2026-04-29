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
