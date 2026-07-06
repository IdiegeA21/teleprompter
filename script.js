  // Paste / edit your script here. This is the default source text.
  const script = `Are you looking for a reliable solar backup system? Let me introduce you to the MECO 1kw/500w solar generator going for just 305,000, paired with a 410watt panel going for 380,000.

This all in one solar generator is easy to use, it provides clean, quiet power for your everyday needs. The 410w solar panel helps recharge the system using sunlight, reducing your dependence on the grid.

With this MECO 1kw/500w solar generator you can power your standing fan or table fan, laptop, desk computer, small refrigerator, depending on their power requirements. IT CAN POWER YOUR HOME APPLIANCES as long as it's not more than 500w.

I honestly can't wait for your patronage...

Bye guys`;

  // Config
  const MAX_WORDS_PER_LINE = 8;      // comfortable chunk size on screen
  const MIN_SPLIT_WORDS = 3;         // don't split into fragments smaller than this
  const CONJUNCTIONS = /\b(and|but|or|nor|so|yet|because|although|though|while|whereas|since|unless|if|when|which|that)\b/i;

  let lines = [];       // array of { words: [...], pauseAfter: ms }
  let currentLine = 0;
  let currentWord = 0;
  let playing = false;
  let wpm = 170;
  let timer = null;
  let lineEls = [];      // DOM refs, one per line (+1 "Finished" row)

  // Smart chunking
  function wordCount(str) {
    const t = str.trim();
    return t ? t.split(/\s+/).length : 0;
  }

  // Rough syllable estimate: count vowel-groups, with small corrections.
  // Good enough to tell "a" from "wonderful" apart for pacing purposes.
  function estimateSyllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 1;
    let matches = w.match(/[aeiouy]+/g);
    let count = matches ? matches.length : 1;
    if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
    return Math.max(1, count);
  }

  // Longer / multi-syllable words linger on screen longer than short ones,
  // scaled around the base per-word duration implied by the current wpm.
  function getWordDelay(word) {
    const base = 60000 / wpm;
    const syl = estimateSyllables(word);
    const factor = Math.min(2.3, Math.max(0.72, 0.5 + syl * 0.42));
    return base * factor;
  }

  function splitKeepDelim(text, regex) {
    const pieces = [];
    let last = 0;
    let m;
    const re = new RegExp(regex, 'g');
    while ((m = re.exec(text)) !== null) {
      pieces.push(text.slice(last, m.index + m[0].length));
      last = m.index + m[0].length;
    }
    pieces.push(text.slice(last));
    return pieces.map(p => p.trim()).filter(p => p.length > 0);
  }

  function splitAtBestConjunction(text) {
    const re = new RegExp(CONJUNCTIONS.source, 'gi');
    let m;
    let best = null;
    let bestDist = Infinity;
    const mid = text.length / 2;
    while ((m = re.exec(text)) !== null) {
      const dist = Math.abs(m.index - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = m.index;
      }
    }
    if (best === null) return [text];
    const before = text.slice(0, best).trim();
    const after = text.slice(best).trim();
    if (wordCount(before) < MIN_SPLIT_WORDS || wordCount(after) < MIN_SPLIT_WORDS) {
      return [text];
    }
    return [before, after];
  }

  function splitByWordCount(text, maxWords) {
    const words = text.trim().split(/\s+/);
    const out = [];
    for (let i = 0; i < words.length; i += maxWords) {
      out.push(words.slice(i, i + maxWords).join(' '));
    }
    return out;
  }

  function chunkText(text, maxWords) {
    text = text.trim();
    if (!text) return [];
    if (wordCount(text) <= maxWords) return [text];

    // 1. commas, semicolons, colons (only when followed by a space —
    // avoids splitting inside numbers like 305,000 or times like 3:45)
    let pieces = splitKeepDelim(text, /[,;:](?=\s|$)/);
    if (pieces.length > 1) {
      return pieces.flatMap(p => chunkText(p, maxWords));
    }

    // 2. dashes used as clause breaks (spaced, not hyphenated words)
    pieces = splitKeepDelim(text, / [-–—] /);
    if (pieces.length > 1) {
      return pieces.flatMap(p => chunkText(p, maxWords));
    }

    // 3. conjunctions, split near the middle
    pieces = splitAtBestConjunction(text);
    if (pieces.length > 1) {
      return pieces.flatMap(p => chunkText(p, maxWords));
    }

    // 4. last resort: hard split by word count
    return splitByWordCount(text, maxWords);
  }

  function splitSentences(paragraph) {
    return paragraph
      .split(/(?<=[.!?…])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  function prepareScript(sourceText) {
    const paragraphs = sourceText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const chunks = [];

    paragraphs.forEach(paragraph => {
      const sentences = splitSentences(paragraph);
      sentences.forEach(sentence => {
        chunkText(sentence, MAX_WORDS_PER_LINE).forEach(chunk => {
          chunks.push(chunk);
        });
      });
    });

    lines = chunks.map(chunk => {
      const words = chunk.split(/\s+/);
      const last = chunk.trim().slice(-1);
      return {
        words,
        pauseAfter: /[.!?…]/.test(last) ? 480 : (/[,;:]/.test(last) ? 260 : 160)
      };
    });

    currentLine = 0;
    currentWord = 0;
    buildTrack();
    renderActiveLine();
    renderPositions();
    updateProgress();
  }

  // Lyrics-style track rendering
  function buildTrack() {
    const track = document.getElementById('lyricsTrack');
    track.innerHTML = '';
    lineEls = [];

    lines.forEach((line) => {
      const div = document.createElement('div');
      div.className = 'lyric-line';
      div.textContent = line.words.join(' ');
      track.appendChild(div);
      lineEls.push(div);
    });

    // extra row shown once playback reaches the end
    const endDiv = document.createElement('div');
    endDiv.className = 'lyric-line lyric-end';
    endDiv.textContent = 'Finished ✔';
    track.appendChild(endDiv);
    lineEls.push(endDiv);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderActiveLine() {
    if (currentLine >= lines.length) return;
    const words = lines[currentLine].words;
    const el = lineEls[currentLine];
    el.innerHTML = words
      .map((word, index) => {
        let cls = 'word';
        if (index < currentWord) cls += ' read';
        if (index === currentWord) cls += ' current';
        return `<span class="${cls}">${escapeHtml(word)}</span>`;
      })
      .join(' ');
  }

  function renderPositions() {
    if (lineEls.length === 0) return;

    lineEls.forEach((el, i) => {
      const dist = i - currentLine;
      el.classList.remove('active', 'near', 'far', 'hidden-line');
      if (dist === 0) el.classList.add('active');
      else if (Math.abs(dist) === 1) el.classList.add('near');
      else if (Math.abs(dist) <= 3) el.classList.add('far');
      else el.classList.add('hidden-line');

      // non-active real lines just show plain text (no per-word highlight)
      if (i !== currentLine && i < lines.length) {
        el.textContent = lines[i].words.join(' ');
      }
    });

    const rowHeight = getRowHeight();
    const viewport = document.getElementById('lyricsViewport');
    const centerY = viewport.clientHeight / 2;
    const offset = centerY - (currentLine * rowHeight + rowHeight / 2);
    document.getElementById('lyricsTrack').style.transform = `translateY(${offset}px)`;
  }

  function getRowHeight() {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--row-height');
    return parseInt(val) || 130;
  }

  function updateProgress() {
    const el = document.getElementById('progress');
    if (lines.length === 0) { el.textContent = ''; return; }
    el.textContent = `Line ${Math.min(currentLine + 1, lines.length)} / ${lines.length}`;
  }

  // Playback
  function scheduleNext(delay) {
    clearTimeout(timer);
    timer = setTimeout(advance, delay);
  }

  function advance() {
    if (!playing) return;

    currentWord++;

    if (currentWord >= lines[currentLine].words.length) {
      const pause = lines[currentLine].pauseAfter;
      currentLine++;
      currentWord = 0;
      renderPositions();
      updateProgress();

      if (currentLine >= lines.length) {
        playing = false;
        clearTimeout(timer);
        return;
      }

      renderActiveLine();
      scheduleNext(pause + getWordDelay(lines[currentLine].words[0]) * 0.4);
      return;
    }

    renderActiveLine();
    scheduleNext(getWordDelay(lines[currentLine].words[currentWord]));
  }

  function play() {
    if (lines.length === 0) return;
    if (currentLine >= lines.length) {
      currentLine = 0;
      currentWord = 0;
      renderPositions();
      renderActiveLine();
      updateProgress();
    }
    playing = true;
    scheduleNext(getWordDelay(lines[currentLine].words[currentWord]));
  }

  function pause() {
    playing = false;
    clearTimeout(timer);
  }

  // UI wiring
  function loadFromTextarea() {
    pause();
    const text = document.getElementById('scriptInput').value;
    prepareScript(text);
  }

  function toggleControls() {
    document.getElementById('controls').classList.toggle('hidden');
    setTimeout(renderPositions, 320);
  }

  function updateSpeedTag() {
    document.getElementById('speedTag').textContent = `${wpm} wpm`;
  }

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const typing = active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');

    if (e.code === 'Space' && !typing) {
      e.preventDefault();
      if (playing) pause(); else play();
    }

    if (e.key === 'ArrowUp' && !typing) {
      e.preventDefault();
      wpm += 10;
      updateSpeedTag();
    }

    if (e.key === 'ArrowDown' && !typing) {
      e.preventDefault();
      wpm = Math.max(60, wpm - 10);
      updateSpeedTag();
    }

    if ((e.key === 'f' || e.key === 'F') && !typing) {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }

    if ((e.key === 'c' || e.key === 'C') && !typing) {
      toggleControls();
    }
  });

  window.addEventListener('resize', () => renderPositions());

  // Init
  document.getElementById('scriptInput').value = script;
  updateSpeedTag();
  prepareScript(script);