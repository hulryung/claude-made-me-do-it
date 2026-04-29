// claude-made-me-do-it — whitespace cleaner
// Pure function. Exposed on window for console testing.

(function (root) {
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

  root.cleanText = cleanText;
})(typeof window !== 'undefined' ? window : globalThis);
