/* Vocal Licks theory engine: chords, styles, chord-scale matching, riff landing.
   Works in the browser (window.VL.theory) and in Node (module.exports) for tests. */
(function (root) {
  const T = {};
  const mod = (n, m = 12) => ((n % m) + m) % m;
  T.mod = mod;

  T.SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  T.FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  T.KEYNAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  T.DEG = { 0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4", 6: "b5", 7: "5", 8: "b6", 9: "6", 10: "b7", 11: "7" };
  T.EXT = { 0: "R", 1: "b9", 2: "9", 3: "b3", 4: "3", 5: "11", 6: "#11", 7: "5", 8: "b13", 9: "13", 10: "b7", 11: "7" };

  /* ---------- chord qualities ---------- */
  T.QUAL = {
    maj: [0, 4, 7], add9: [0, 4, 7, 14], "6": [0, 4, 7, 9], "69": [0, 4, 7, 9, 14], maj7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14],
    m: [0, 3, 7], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], m11: [0, 3, 7, 10, 14, 17], m6: [0, 3, 7, 9],
    "7": [0, 4, 7, 10], "9": [0, 4, 7, 10, 14], "13": [0, 4, 7, 10, 14, 21], "7b9": [0, 4, 7, 10, 13],
    dim: [0, 3, 6], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10]
  };
  T.SUFFIX = {
    maj: "", add9: "add9", "6": "6", "69": "6/9", maj7: "maj7", maj9: "maj9", m: "m", m7: "m7", m9: "m9", m11: "m11", m6: "m6",
    "7": "7", "9": "9", "13": "13", "7b9": "7♭9", dim: "°", dim7: "°7", m7b5: "ø7"
  };
  T.family = q => (["m", "m7", "m9", "m11", "m6"].includes(q) ? "min"
    : ["7", "9", "13", "7b9"].includes(q) ? "dom"
    : q === "m7b5" ? "hdim" : (q === "dim" || q === "dim7") ? "dim" : "maj");

  /* ---------- modes and scales ---------- */
  T.MODES = {
    ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10], phrygdom: [0, 1, 4, 5, 7, 8, 10], dimwh: [0, 2, 3, 5, 6, 8, 9, 11]
  };
  T.MODE_NAME = {
    ionian: "Ionian (major)", dorian: "Dorian", phrygian: "Phrygian", lydian: "Lydian", mixolydian: "Mixolydian",
    aeolian: "Aeolian (natural minor)", locrian: "Locrian", phrygdom: "Phrygian dominant", dimwh: "Diminished (whole-half)"
  };
  const ROT = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];
  T.MINPENT = [0, 3, 5, 7, 10];
  T.BLUES = [0, 3, 5, 6, 7, 10];

  /* tonality: the scale the whole progression lives in */
  T.TONALITY = {
    major: { base: "ionian", fit: [0, 2, 3, 4, 5, 7, 8, 9, 10, 11], label: "major" },
    minor: { base: "aeolian", fit: [0, 2, 3, 5, 7, 8, 10, 11], label: "minor" },
    mixolydian: { base: "mixolydian", fit: [0, 2, 4, 5, 7, 9, 10, 11], label: "Mixolydian" },
    blues: { base: "mixolydian", fit: null, label: "blues" }
  };

  /* ---------- Roman numerals ---------- */
  const NUM = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };
  T.parseNumeral = function (s) {
    const m = /^(b|#)?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(maj7|7|ø|°)?$/.exec(s);
    if (!m) throw new Error("Bad numeral " + s);
    const acc = m[1] === "b" ? -1 : m[1] === "#" ? 1 : 0;
    const upper = m[2] === m[2].toUpperCase();
    const deg = mod(NUM[m[2].toUpperCase()] + acc);
    let fam, hint = m[3] || "";
    if (hint === "ø") fam = "hdim";
    else if (hint === "°") fam = "dim";
    else if (!upper) fam = "min";
    else if (hint === "7") fam = "dom";
    else fam = "maj";
    return { text: s.replace("b", "♭").replace("#", "♯"), deg, fam, hint };
  };

  /* ---------- styles ---------- */
  T.STYLES = {
    rock: { name: "Rock", maj: ["maj"], min: ["m"], dom: ["maj"], hdim: ["dim"], dim: ["dim"], voicing: "triad", comp: "rock", swing: false,
      blurb: "Plain triads, driving eighth notes." },
    pop: { name: "Pop", maj: ["add9", "maj"], min: ["m7", "m"], dom: ["7"], hdim: ["m7b5"], dim: ["dim7"], voicing: "triad", comp: "pop", swing: false,
      blurb: "Triads with added 9ths, half-note pulse." },
    rnb: { name: "R&B / neo-soul", maj: ["maj9", "maj7", "add9", "maj"], min: ["m9", "m7", "m"], dom: ["9", "7b9", "7"], hdim: ["m7b5"], dim: ["dim7"], voicing: "rootless", comp: "rnb", swing: false,
      blurb: "9th chords played without the root, laid-back sixteenths." },
    gospel: { name: "Gospel", maj: ["maj9", "69", "add9", "maj"], min: ["m11", "m9", "m7", "m"], dom: ["13", "9", "7b9", "7"], hdim: ["m7b5"], dim: ["dim7"], voicing: "rootless", comp: "gospel", swing: false,
      blurb: "Big 9, 11, and 13 chords with bass walk-ups." },
    blues: { name: "Blues", maj: ["7"], min: ["m7"], dom: ["7"], hdim: ["m7b5"], dim: ["dim7"], voicing: "triad", comp: "blues", swing: true, noFit: true,
      blurb: "Every major chord becomes a dominant 7, with a shuffle." },
    jazz: { name: "Jazz", maj: ["maj7", "6", "maj"], min: ["m7", "m"], dom: ["7", "7b9"], hdim: ["m7b5"], dim: ["dim7"], voicing: "shell", comp: "jazz", swing: true,
      blurb: "Two-note shells (3rd and 7th), walking bass, swing." }
  };

  const pcsOf = (root, q) => [...new Set(T.QUAL[q].map(i => mod(root + i)))];
  T.pcsOf = pcsOf;
  const subset = (a, b) => a.every(x => b.includes(x));

  /* pick the concrete chord quality for a numeral in a style */
  T.realize = function (num, keyPc, tonality, styleId) {
    const style = T.STYLES[styleId];
    const root = mod(keyPc + num.deg);
    let list = style[num.fam].slice();
    // an explicit maj7 in the numeral wins in styles that use 7th chords
    if (num.hint === "maj7" && ["rnb", "gospel", "jazz"].includes(styleId)) list = ["maj9", "maj7"].filter(q => style.maj.includes(q)).concat(list);
    const fit = T.TONALITY[tonality].fit;
    let q = list[list.length - 1];
    if (style.noFit || !fit) q = list[0];
    else {
      const fitAbs = fit.map(i => mod(keyPc + i));
      for (const cand of list) { if (subset(pcsOf(root, cand), fitAbs)) { q = cand; break; } }
    }
    return { root, q, fam: T.family(q), num, pcs: pcsOf(root, q) };
  };

  T.spell = function (pc, useFlats) { return (useFlats ? T.FLAT : T.SHARP)[mod(pc)]; };
  /* flats for keys that are conventionally written with flats */
  T.keyUsesFlats = function (keyPc, tonality) {
    const majTonic = tonality === "minor" ? mod(keyPc + 3) : tonality === "mixolydian" || tonality === "blues" ? mod(keyPc + 5) : keyPc;
    return [5, 10, 3, 8, 1].includes(majTonic) || (majTonic === 0 && tonality === "minor");
  };
  T.chordName = (c, fl) => T.spell(c.root, fl) + T.SUFFIX[c.q];
  /* spell a note by its interval from a spelled chord root (so D7's 3rd is F#, not Gb) */
  const LET = ["C", "D", "E", "F", "G", "A", "B"], NAT = [0, 2, 4, 5, 7, 9, 11];
  const STEPS = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6 };
  T.spellRel = function (rootPc, rootName, pc, flatFive) {
    const iv = mod(pc - rootPc);
    let st = STEPS[iv]; if (iv === 6 && flatFive) st = 4;
    const li = (LET.indexOf(rootName[0]) + st) % 7;
    const diff = mod(pc - NAT[li]);
    if (diff === 0) return LET[li];
    if (diff === 1) return LET[li] + "#";
    if (diff === 11) return LET[li] + "b";
    return T.SHARP[mod(pc)];
  };

  /* ---------- chord-scale matching ---------- */
  function rotName(chordRoot, scaleAbs) {
    const rel = scaleAbs.map(p => mod(p - chordRoot)).sort((a, b) => a - b);
    for (const n of ROT) if (T.MODES[n].every((v, i) => v === rel[i])) return n;
    return null;
  }

  const TAGS = {
    sweet: ["Sweet", "Safe", "Lush", "Chord tones", "Dorian color", "m9 color", "Phrygian color", "Lydian shine", "Bluesy", "Gritty", "Advanced"],
    bluesy: ["Bluesy", "Gritty", "Safe", "m9 color", "Sweet", "Chord tones", "Dorian color", "Lush", "Phrygian color", "Lydian shine", "Advanced"],
    color: ["Lush", "Dorian color", "Lydian shine", "m9 color", "Phrygian color", "Bluesy", "Sweet", "Safe", "Chord tones", "Gritty", "Advanced"]
  };
  T.FLAVORS = { sweet: "Sweet", bluesy: "Bluesy", color: "Color" };

  function pentHome(minorRoot, tag, why) {
    return { kind: "pent", minorRoot: mod(minorRoot), pcs: T.MINPENT.map(i => mod(minorRoot + i)), tag, why };
  }

  T.chordScale = function (chord, next, tonality, keyPc) {
    const r = chord.root, fam = chord.fam;
    const tn = T.TONALITY[tonality];
    const keyScale = T.MODES[tn.base].map(i => mod(keyPc + i));
    let mode;
    const resolvesToMinor = next && next.fam === "min" && mod(next.root - r) === 5;
    if (fam === "dim") mode = "dimwh";
    else if (fam === "hdim") mode = "locrian";
    else if ((fam === "dom" || fam === "maj") && resolvesToMinor && !subset(chord.pcs, keyScale)) mode = "phrygdom";
    else if ((fam === "dom" || fam === "maj") && resolvesToMinor && fam === "dom") mode = "phrygdom";
    else if (subset(chord.pcs, keyScale) && rotName(r, keyScale)) mode = rotName(r, keyScale);
    else {
      const fitAbs = (tn.fit || T.MODES.mixolydian).map(i => mod(keyPc + i)).concat(keyScale);
      const cands = fam === "dom" ? ["mixolydian"] : fam === "min" ? ["dorian", "aeolian", "phrygian"] : ["ionian", "mixolydian", "lydian"];
      let bestM = null, bestS = -1;
      cands.forEach(c => {
        const pcs = T.MODES[c].map(i => mod(r + i));
        if (!chord.pcs.every(p => pcs.includes(p))) return;
        const s = pcs.filter(p => keyScale.includes(p)).length * 2 + pcs.filter(p => fitAbs.includes(p)).length;
        if (s > bestS) { bestS = s; bestM = c; }
      });
      mode = bestM || (fam === "dom" ? "mixolydian" : fam === "min" ? "dorian" : "ionian");
    }
    // keep chord-quality consistency (a dom chord must get a b7 mode, a maj7 chord a natural 7 mode)
    if (fam === "dom" && !["mixolydian", "phrygdom"].includes(mode)) mode = "mixolydian";
    if (fam === "min" && !["dorian", "aeolian", "phrygian"].includes(mode)) mode = "dorian";
    if (fam === "maj" && chord.q !== "7" && !["ionian", "lydian", "mixolydian", "phrygdom"].includes(mode)) mode = "ionian";
    if (fam === "maj" && chord.pcs.includes(mod(r + 11)) && mode === "mixolydian") mode = "ionian";

    const modePcs = T.MODES[mode].map(i => mod(r + i));
    let homes = [];
    if (mode === "ionian" || mode === "lydian" || (fam === "maj" && mode === "mixolydian")) {
      homes.push(pentHome(r + 9, "Sweet", "Same notes as the major pentatonic on the root."));
      homes.push(pentHome(r + 4, "Lush", "Starts on the 3rd, so it spells a maj7/9 sound."));
      if (mode === "lydian") homes.push(pentHome(r + 11, "Lydian shine", "Adds the #11 for a bright, floating sound."));
      if (mode === "mixolydian") homes.push(pentHome(r + 7, "Bluesy", "A 5th above the root: 9, 11, 5, b7."));
    } else if (mode === "mixolydian") {
      homes.push(pentHome(r + 7, "Bluesy", "A 5th above the root: gives the 9, 11, 5, and b7."));
      homes.push(pentHome(r + 9, "Sweet", "A 6th above the root: has the 3rd and the 13th."));
      homes.push({ kind: "blues", minorRoot: r, pcs: T.BLUES.map(i => mod(r + i)), tag: "Gritty", blue: true,
        why: "Blues scale on the root. Its b3 rubs against the chord's 3rd on purpose." });
    } else if (mode === "phrygdom") {
      homes.push({ kind: "arp", minorRoot: r, pcs: [0, 4, 7, 10, 1].map(i => mod(r + i)), tag: "Chord tones",
        why: "Outline the chord itself (with the b9). This is the chord where the key's pentatonic fails." });
    } else if (mode === "dorian") {
      homes.push(pentHome(r, "Safe", "Minor pentatonic on the root always fits."));
      homes.push(pentHome(r + 2, "Dorian color", "A whole step above: 9, 11, 5, 13."));
      homes.push(pentHome(r + 7, "m9 color", "A 5th above: 5, b7, root, 9, 11."));
    } else if (mode === "aeolian") {
      homes.push(pentHome(r, "Safe", "Minor pentatonic on the root always fits."));
      homes.push(pentHome(r + 7, "m9 color", "A 5th above: 5, b7, root, 9, 11."));
    } else if (mode === "phrygian") {
      homes.push(pentHome(r, "Safe", "Minor pentatonic on the root."));
      homes.push(pentHome(r + 10, "Phrygian color", "A whole step below: adds the dark b9 and b6."));
    } else if (mode === "locrian") {
      homes.push(pentHome(r + 3, "Advanced", "Minor pentatonic on the b3."));
    } else {
      homes.push({ kind: "arp", minorRoot: r, pcs: chord.pcs.slice(), tag: "Chord tones", why: "Stick to the chord tones on this passing chord." });
    }
    homes = homes.filter(h => h.blue || subset(h.pcs, modePcs));

    // targets: guide tones first
    const rank = { 3: 1, 4: 1, 10: 2, 11: 2, 9: 3, 2: 4, 14: 4, 0: 5, 7: 6, 6: 3, 1: 4, 5: 5, 8: 6 };
    const targets = chord.pcs.map(pc => {
      const iv = mod(pc - r);
      let pr = rank[iv] || 7;
      if (chord.fam === "dim") pr = 3;
      return { pc, iv, label: T.EXT[iv], pr };
    }).sort((a, b) => a.pr - b.pr);

    // avoid: scale notes a half step above a chord tone (the classic "don't hold" notes)
    const avoid = modePcs.filter(pc => !chord.pcs.includes(pc) && chord.pcs.includes(mod(pc - 1)))
      .map(pc => ({ pc, label: T.EXT[mod(pc - r)] }));

    return { mode, modeName: T.MODE_NAME[mode], modePcs, homes, targets, avoid };
  };

  T.pickHome = function (info, flavor) {
    const order = TAGS[flavor] || TAGS.sweet;
    return info.homes.slice().sort((a, b) => order.indexOf(a.tag) - order.indexOf(b.tag))[0];
  };

  /* one pentatonic for the whole progression */
  T.keyHome = function (tonality, keyPc) {
    if (tonality === "major") return pentHome(keyPc + 9, "Key", "Relative minor pentatonic: the same notes as the major pentatonic of the key.");
    if (tonality === "minor") return pentHome(keyPc, "Key", "Minor pentatonic on the key note.");
    if (tonality === "mixolydian") return pentHome(keyPc + 7, "Key", "Minor pentatonic a 5th above the key note fits the Mixolydian sound.");
    return { kind: "pent", minorRoot: keyPc, pcs: T.MINPENT.map(i => mod(keyPc + i)), tag: "Key", blues: true,
      why: "Minor pentatonic on the key note. Over major chords its b3 is the blue note, which is the point in blues and rock." };
  };

  /* what in a home fights this chord */
  T.clashes = function (home, chord, info) {
    const out = [];
    home.pcs.forEach(pc => {
      if (chord.pcs.includes(pc)) return;
      const clashWith = chord.pcs.find(c => Math.abs(mod(pc - c + 6) - 6) === 1);
      if (!info.modePcs.includes(pc) && clashWith !== undefined) out.push({ pc, against: clashWith, hard: true });
      else if (info.avoid.some(a => a.pc === pc)) out.push({ pc, against: clashWith, hard: false });
    });
    return out;
  };

  /* ---------- riff placement ---------- */
  /* all midi notes in [lo,hi] whose pitch class is in pcs, ascending */
  T.ladder = function (pcs, lo, hi) {
    const a = [];
    for (let m = lo; m <= hi; m++) if (pcs.includes(mod(m))) a.push(m);
    return a;
  };

  /* Place a pentatonic riff shape so its LAST note lands on a target of the next chord.
     shape: step offsets inside the home (0 = the home's minor root direction-agnostic index)
     returns {notes:[midi], altered:bool, lastLabel} */
  T.landRiff = function (steps, home, targets, lo, hi, center, prevLast) {
    const lad = T.ladder(home.pcs, lo - 12, hi + 12);
    const n = steps.length, last = steps[n - 1];
    let best = null;
    for (let j = 0; j < lad.length; j++) {
      const idx = steps.map(s => j + s);
      if (idx.some(i => i < 0 || i >= lad.length)) continue;
      const notes = idx.map(i => lad[i]);
      if (notes.some(m => m < lo || m > hi)) continue;
      const lastPc = mod(lad[j + last]);
      const t = targets ? targets.find(x => x.pc === lastPc) : null;
      if (targets && !t) continue;
      const mean = notes.reduce((a, b) => a + b, 0) / n;
      let score = (t ? t.pr * 40 : 0) + Math.abs(mean - center);
      if (prevLast != null) score += Math.abs(notes[0] - prevLast) * 0.6;
      if (!best || score < best.score) best = { score, notes, altered: false, t };
    }
    if (best || !targets) return best;
    // no natural landing: place it, then bend the last note to the nearest target (an R&B move)
    for (let j = 0; j < lad.length; j++) {
      const idx = steps.map(s => j + s);
      if (idx.some(i => i < 0 || i >= lad.length)) continue;
      const notes = idx.map(i => lad[i]);
      if (notes.some(m => m < lo || m > hi)) continue;
      const lastM = notes[n - 1];
      let bend = null;
      for (const d of [1, -1, 2, -2]) {
        const t = targets.find(x => x.pc === mod(lastM + d));
        if (t && (!bend || t.pr < bend.t.pr)) bend = { d, t };
      }
      if (!bend) continue;
      const nn = notes.slice(); nn[n - 1] = lastM + bend.d;
      if (nn[n - 1] < lo || nn[n - 1] > hi) continue;
      const mean = nn.reduce((a, b) => a + b, 0) / n;
      const score = bend.t.pr * 40 + Math.abs(mean - center) + Math.abs(bend.d) * 5 + (prevLast != null ? Math.abs(nn[0] - prevLast) * 0.6 : 0);
      if (!best || score < best.score) best = { score, notes: nn, altered: true, t: bend.t };
    }
    return best;
  };

  /* enclosure: scale step above, half step below, target */
  T.enclose = function (home, targets, lo, hi, center) {
    let best = null;
    for (const t of targets.slice(0, 3)) {
      for (let m = lo + 1; m <= hi - 2; m++) {
        if (mod(m) !== t.pc) continue;
        const above = T.ladder(home.pcs.concat([t.pc]), m + 1, m + 4)[0] || m + 2;
        const notes = [above, m - 1, m];
        const score = t.pr * 40 + Math.abs(m - center);
        if (!best || score < best.score) best = { score, notes, altered: false, t, chromatic: [1] };
      }
    }
    return best;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = T;
  else { root.VL = root.VL || {}; root.VL.theory = T; }
})(typeof window !== "undefined" ? window : globalThis);
