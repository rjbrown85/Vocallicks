# Vocal Licks

A practice app for singing R&B riffs, built around Crystal Cherelle's five riff "building blocks" (Indie Artist School) and extended to singing those riffs over chord progressions. It runs in any browser with no build step.

**Live app:** [rjbrown85.github.io/Vocallicks](https://rjbrown85.github.io/Vocallicks/)

## Five chapters

1. **Blocks.** The original Riff Blocks drills: the five riffs with five-step ladders, the key walk, moving each shape through the scale, her combinations, a combo builder, and the log.
2. **Changes.** Thirty-four progressions (pop and R&B plus rock and blues, most from David Bennett's videos, including Wonderwall, Purple Rain, Pachelbel's Canon, and Where Is My Mind), plus **Make my own** for building your own two- to eight-chord loop in a major, minor, Dorian, Mixolydian, or blues feel, in six styles: rock, pop, R&B/neo-soul, gospel, blues, and jazz. Each chord card shows the mode it implies, which minor pentatonic to riff from, which notes to land on, and which notes not to hold. Riffs are placed so their last note lands on a chord tone of the next chord. Choose one scale for the whole key or a new scale on every chord. In **My arrangement** mode the riff lane becomes an arranger: pick or drag riffs onto lock spots that the app has checked against every chord they sound over (gold spots land on a chord change on its 3rd or 7th, green spots fit and end on a chord tone), chain riffs into longer phrases, ask for a suggested chain, and save arrangements by name.
3. **Vocabulary.** Thirteen more licks (cascades, turns, climbs, triplets, enclosures, neighbor flips, rising 3s, blue-note slide and turn, gospel descent, arpeggio runs), five scale runs (pentatonic up and down, pentatonic fall, five-note minor and major, natural minor octave), some of which also work over progressions, and a workbench of practice methods: doo first, chunks, build from the end, move the accent, rhythm swap, and speed up.
4. **Session.** A daily routine that rotates riffs and progressions (with an arranging step and a Next button that moves you through it), your saved arrangements, a 14-day streak, progress from your rated runs, and a recorder that mixes your voice with the loop.

5. **Guide.** Every explanation in one place, so the working screens stay short. The small **?** buttons jump to the matching entry.

Drills use **Tight** spacing by default: each round lasts the riff plus one beat, and the count-in is two clicks. Switch to **Roomy** in Setup for the original whole-bar rounds.

Recording needs microphone access, which works on GitHub Pages but not in the claude.ai preview.

## Run it locally

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` from Finder works too, but the browser may block the piano samples and fall back to the simple synth.

## Files

```
index.html          page shell and chapter markup
css/zine.css        the zine look
js/theory.js        chords, styles, chord-scale matching, riff landing, arranger lock spots (also runs in Node)
js/data.js          riffs, combos, progressions, vocabulary, practice methods
js/core.js          settings, log, now-playing bar, chapter router
js/audio.js         piano sampler, synth fallback, timeline scheduler
js/blocks.js        chapter 01
js/changes.js       chapter 02
js/vocab.js         chapter 03
js/session.js       chapter 04
js/guide.js         chapter 05 (built from data.js and theory.js)
js/app.js           startup and the Setup drawer
tests/theory.test.js  node tests/theory.test.js
tools/bundle.py     builds a single-file copy for a claude.ai preview
piano/ vendor/ fonts/ docs/
```

Adding a progression or a lick means adding one entry to `js/data.js`.

## Tests

`node tests/theory.test.js` checks every progression in every style and key: riff scales fit the chord's mode, landing notes are chord tones, riffs stay in range, and specific cases like D7 (A or B minor pentatonic, not E), Dm7 (E minor pentatonic as Dorian color), and E7 going to Am (flagged clash). It also checks every arranger lock spot note by note and confirms suggested chains never overlap.

## Credits

Riffs and method by Crystal Cherelle, Indie Artist School. Progressions from David Bennett's videos, Open Music Theory, and Tunable. Piano by Alexander Holm (CC BY 3.0) through Tone.js. Full details in [CREDITS.md](CREDITS.md). App code is MIT licensed; see [LICENSE](LICENSE).
