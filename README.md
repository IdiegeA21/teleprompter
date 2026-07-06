# Lyrics-Style Teleprompter

A single-file, no-dependency teleprompter built for recording talking-head videos. Instead of scrolling a wall of text, it displays your script the way Spotify or Shazam display lyrics: the current phrase sits front and center, highlighted word by word, with the lines before and after visible (and faded) above and below.

No build step, no frameworks, no external libraries — it's one `.html` file you can open directly in a browser.

## Features

- **Smart sentence chunking** — the script is split by sentence first, and only broken into smaller pieces (at commas, semicolons, dashes, then conjunctions, then as a last resort a flat word count) when a sentence is too long to read comfortably in one glance. Numbers like `305,000` and times like `3:45` are protected from being split apart.
- **Karaoke-style word highlighting** — the active line lights up one word at a time as it's meant to be spoken.
- **Syllable-aware pacing** — longer, multi-syllable words are given more time on screen than short ones, so the highlight doesn't blow past a word before you've finished saying it.
- **Click-to-seek navigation** — click any visible line (past, current, or upcoming) to jump straight to it, just like tapping a lyric line in Spotify. No need to reload or restart the script if you flub a line.
- **Keyboard shortcuts** for hands-off control while recording (see below).
- **Adjustable speed**, live, without restarting playback.

## Getting Started

1. Download `index.html` (or clone this repo).
2. Open it in any modern browser (Chrome, Edge, Firefox, Safari). pr you can just visit the hosted link on `https://idiegea21.github.io/teleprompter` and paste in your formated script. Note for best generation, your scirpt should be well formatted with puntuations.
3. Paste your script into the text box at the top and click **Load Script** (or just edit the `const script = ...` block near the top of the `<script>` tag and reload — either works).
4. Press **Space** to start.

That's it — no server, no `npm install`, no build step.

### Using it for actual recording

- Press **F** to go fullscreen so the controls panel and browser chrome are out of frame.
- Press **C** to hide/show the controls panel without leaving fullscreen.
- If you flub a line, just click on it in the lyrics view (or use **←**) to jump back and re-record without restarting the whole script.

## Controls

| Key / Action        | Effect                                   |
|----------------------|-------------------------------------------|
| `Space`              | Play / pause                              |
| `↑` / `↓`            | Increase / decrease speed (words per minute) |
| `←` / `→`            | Jump to the previous / next line          |
| Click a line         | Jump directly to that line                |
| `F`                  | Toggle fullscreen                         |
| `C`                  | Show / hide the controls panel            |

## Customizing

- **Script text**: edit the `const script = \`...\`;` block near the top of the `<script>` tag, or use the on-screen "Load Script" box.
- **Chunk size**: `MAX_WORDS_PER_LINE` near the top of the script controls how many words are allowed on one line before the smart-splitting logic kicks in. Lower it for shorter, punchier lines; raise it for longer ones.
- **Colors / sizing**: all visual styling is driven by CSS custom properties (`--bg`, `--current`, `--dim`, etc.) at the top of the `<style>` block, plus the `.lyric-line.active` / `.near` / `.far` classes that control font size and fade at each distance from the current line.

## Deploying to GitHub Pages

live at `https://idiegea21.github.io/teleprompter`.

## License

Feel free to use, modify, and adapt this for your own projects.