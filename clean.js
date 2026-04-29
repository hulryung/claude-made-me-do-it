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

    // Step: dedent.
    // Identify non-empty lines and their indices.
    const nonEmptyIdx = [];
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i].length > 0) nonEmptyIdx.push(i);
    }

    let prefix = '';
    if (nonEmptyIdx.length >= 2) {
      const firstIdx = nonEmptyIdx[0];
      const lastIdx = nonEmptyIdx[nonEmptyIdx.length - 1];
      const firstLen = leadingWhitespace(trimmed[firstIdx]).length;
      const lastLen = leadingWhitespace(trimmed[lastIdx]).length;

      let excludeFirst = false;
      let excludeLast = false;

      if (nonEmptyIdx.length === 2) {
        // Compare the two lines directly.
        excludeFirst = firstLen === 0 && lastLen > 0;
        excludeLast = lastLen === 0 && firstLen > 0;
      } else {
        // n >= 3: check that every interior non-empty line
        // (strictly between first and last) has leading > 0.
        let interiorAllPositive = true;
        for (let k = 1; k < nonEmptyIdx.length - 1; k++) {
          const len = leadingWhitespace(trimmed[nonEmptyIdx[k]]).length;
          if (len === 0) { interiorAllPositive = false; break; }
        }
        excludeFirst = firstLen === 0 && interiorAllPositive;
        excludeLast = lastLen === 0 && interiorAllPositive;
      }

      // Build the candidate set after exclusion.
      const candidates = [];
      for (let k = 0; k < nonEmptyIdx.length; k++) {
        const idx = nonEmptyIdx[k];
        if (excludeFirst && idx === firstIdx) continue;
        if (excludeLast && idx === lastIdx) continue;
        candidates.push(trimmed[idx]);
      }

      if (candidates.length > 0) {
        let p = null;
        for (let k = 0; k < candidates.length; k++) {
          const lw = leadingWhitespace(candidates[k]);
          p = (p === null) ? lw : commonPrefix(p, lw);
          if (p === '') break;
        }
        prefix = p === null ? '' : p;
      }
    }
    // nonEmptyIdx.length <= 1 → prefix stays '' (no dedent).

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
