# Vocal Licks: Riff Blocks

A practice app for singing R&B riffs, built around the five riff "building blocks" from Crystal Cherelle's lesson at Indie Artist School. It runs in any browser as a single page, with no build step and nothing to install.

**Live app:** turn on GitHub Pages (see below) and it lives at `https://<your-username>.github.io/vocallicks/`.

## What it does

- **The five riffs.** Quick Dip, Swift Lift, Swoopy Swift Lift, Quick Dip Trip, and Skip Quick Dip Trip, each drawn as a staircase of blocks that light up as the piano plays. Each riff has a five-step ladder: listen, detached on "hee" at slow speed, smooth on "ah" at slow speed, speed up toward 100 bpm, and a key walk.
- **Key walk.** Pick any riff or combo plus a lowest and highest note. Each key opens with one bar of the chord that fits the riff, the riff plays four times (or 2, 3, or 6), then everything moves up a half step. After the top key it walks back down.
- **Move the shape.** Runs a riff shape from every step of the scale, so the riffs work anywhere in a melody instead of only from the home note.
- **Combos.** Her eight combinations plus the one she calls clunky, each with listen, slow echo, and echo at tempo, and a builder for chaining your own.
- **Setup.** Scale (minor pentatonic, blues, major, major pentatonic), key, tempo, highest note for the day, octave, sound (grand piano or simple synth), and echo or sing-along rounds.
- **Log.** Rate each run as clean, almost, or messy. The log stays in your browser only.

This version plays but doesn't listen yet. Record a few rounds on your phone and listen back.

## Run it on your own computer

Open a terminal in this folder and start any static server, for example:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` straight from Finder also works, but the browser may block the piano samples and fall back to the simple synth.

## Put it online with GitHub Pages

1. In the repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the `main` branch and the `/ (root)` folder, then save.
4. After a minute or two the site appears at `https://<your-username>.github.io/vocallicks/`.

On a free GitHub account, Pages only works for public repositories.

## Files

```
index.html            the whole app
piano/                Salamander Grand Piano samples, A1 to C6 every minor third
vendor/Tone.min.js    Tone.js 15.5.42
fonts/                bundled fonts and their licenses
docs/riff-spec.md     the riff notes, rhythms, and combos the app is built on
```

Everything loads from this repository, so the app doesn't depend on Google Fonts or a CDN.

## Credits

Riffs and method by Crystal Cherelle, Indie Artist School. Piano by Alexander Holm (CC BY 3.0). Full details in [CREDITS.md](CREDITS.md). App code is MIT licensed; see [LICENSE](LICENSE).
