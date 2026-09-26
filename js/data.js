/* Vocal Licks data: riffs, combos, progressions, vocabulary patterns. */
(function (root) {
  const D = {};

  /* ---- Crystal Cherelle's five building blocks (from her Riff Builder MIDI) ---- */
  const R = { qd: [.5, .25, .25], sl: [.5, .25, .25], sw: [.5, .25, .25, .125, .625], qdt: [1, .25, .25, 1], skip: [.5, 1, .25, .25, 1] };
  const V = { qd: [.85, .72, .64], sl: [.86, .8, .66], sw: [.86, .8, .74, .78, .82], qdt: [.84, .82, .8, .62], skip: [1, .82, .8, .8, .62] };
  function mk(steps) { const o = {}; for (const k in steps) o[k] = { n: steps[k], b: R[k], v: V[k] }; return o; }
  D.SETS = {
    minor: { name: "minor pentatonic", tonic: 64, scale: [0, 3, 5, 7, 10], minor: true,
      blocks: mk({ qd: [0, -1, -2], sl: [-2, -1, 0], sw: [-2, -1, 0, -1, 0], qdt: [0, -1, -2, -3], skip: [1, 0, -1, -2, -3] }) },
    blues: { name: "blues", tonic: 64, scale: [0, 3, 5, 7, 10], minor: true, shapeSet: "minor",
      blocks: Object.assign(mk({ qd: [0, -1, -2], sl: [-2, -1, 0], sw: [-2, -1, 0, -1, 0] }), {
        qdt: { n: [0, -1, -2, [-3, 1], -3], b: [1, .25, .25, .25, .25], v: [.84, .82, .8, .8, .62] },
        skip: { n: [1, 0, -1, -2, [-3, 1], -3], b: [.5, 1, .25, .25, .25, .75], v: [1, .82, .8, .8, .8, .62] } }) },
    major: { name: "major", tonic: 60, scale: [0, 2, 4, 5, 7, 9, 11], minor: false,
      blocks: mk({ qd: [2, 1, 0], sl: [0, 1, 2], sw: [0, 1, 2, 1, 2], qdt: [2, 1, 0, -1], skip: [4, 2, 1, 0, -1] }) },
    majpent: { name: "major pentatonic", tonic: 57, scale: [0, 2, 4, 7, 9], minor: false,
      blocks: mk({ qd: [3, 2, 1], sl: [1, 2, 3], sw: [1, 2, 3, 2, 3], qdt: [3, 2, 1, 0], skip: [4, 3, 2, 1, 0] }) }
  };
  D.BLOCKS = {
    qd: { name: "Quick Dip", num: 1, c: "var(--pink)", on: "var(--ink)", rhythm: "long, short, short",
      tip: "Three notes stepping down from home. Lean on the first note, then let the next two fall away quickly. She says any word or vowel works on it." },
    sl: { name: "Swift Lift", num: 2, c: "var(--blue)", on: "#fff", rhythm: "long, short, short",
      tip: "This is the Quick Dip turned upside down, three notes climbing back home with the same long-short-short rhythm." },
    sw: { name: "Swoopy Swift Lift", num: 3, c: "var(--green)", on: "var(--ink)", rhythm: "long, short, short, flick, hold",
      tip: "A Swift Lift with a small turn on top. Once you land, flick down one note and straight back up so the top note sounds twice, then hold it as long as you like." },
    qdt: { name: "Quick Dip Trip", num: 4, c: "var(--orange)", on: "var(--ink)", rhythm: "hold, short, short, land",
      tip: "A Quick Dip with one more note at the bottom. The first note gets a full beat, and the landing note can be short or held." },
    skip: { name: "Skip Quick Dip Trip", num: 5, c: "var(--yellow)", on: "var(--ink)", rhythm: "accent, hold, short, short, land",
      tip: "It starts above home and skips down to it, then runs the Quick Dip Trip. She sings that first note louder than the rest, which the accent mark shows." }
  };
  D.ORDER = ["qd", "sl", "sw", "qdt", "skip"];
  D.COMBOS = [
    { n: 1, b: ["qd", "sl"], note: "Down, then straight back up. The shared bottom note gets sung twice, so re-attack it cleanly." },
    { n: 2, b: ["qdt", "sl"], note: "She says these two fit together snugly. The lift starts one step above where the trip lands." },
    { n: 3, b: ["sl", "qdt"], note: "The same two blocks in the other order: climb home, then fall past it." },
    { n: 4, b: ["sw", "qdt"], note: "Combo 3 with more flair on top, since the swoop sets up the long note." },
    { n: 5, b: ["skip", "sl"], note: "The skip opens it, and the lift brings you back home at the end." },
    { n: 6, b: ["skip", "sw"], note: "Her favorite of the set. She calls the shape two little stairs.", sticker: "her favorite" },
    { n: 7, b: ["sl", "skip"], note: "She swapped in the plain Swift Lift here because the swoopy version felt clunky in front of the skip." },
    { n: 8, b: ["sl", "skip", "sw"], note: "All three chained, which she calls a melodic masterpiece. Learn combo 7 first.", sticker: "the big one" },
    { n: null, b: ["sw", "skip"], note: "She plays this order to show a join that doesn't work. The two halves sound separate. Listen for the gap, then compare with combo 7.", sticker: "listen for the gap", stickerCls: "blue" }
  ];

  /* ---- Chord progressions. beats: length of each chord in beats at "1 bar per chord". ---- */
  const BENNETT7 = { t: "7 super common chord progressions and why they work", u: "https://www.youtube.com/watch?v=Vyc8lezaa9g" };
  const BENNETT5 = { t: "5 popular chord progressions and why they work", u: "https://www.youtube.com/watch?v=cjOQIbkRQ-4" };
  const OMT = { t: "Open Music Theory: Blues-Based Schemas", u: "https://human.libretexts.org/Bookshelves/Music/Music_Theory/Open_Music_Theory_2e_(Gotham_et_al.)/07%3A_Popular_Music/7.08%3A_Blues-Based_Schemas" };
  D.PROGRESSIONS = [
    { id: "axis", group: "Pop & R&B", name: "Axis", chords: ["I", "V", "vi", "IV"], tonality: "major", src: BENNETT7,
      note: "The most famous four chords in pop. One pentatonic covers all of them." },
    { id: "otheraxis", group: "Pop & R&B", name: "The other Axis", chords: ["vi", "IV", "I", "V"], tonality: "major", src: BENNETT7,
      note: "The same four chords starting on vi, so it feels minor." },
    { id: "popnew", group: "Pop & R&B", name: "Pop's new favorite", chords: ["IV", "I", "vi", "V"], tonality: "major",
      src: { t: "Pop music has a new favourite chord progression", u: "https://www.youtube.com/watch?v=Tj0tkv2tNSo" },
      note: "The Axis chords again, reordered to start on IV." },
    { id: "doowop", group: "Pop & R&B", name: "Doo-wop", chords: ["I", "vi", "IV", "V"], tonality: "major", src: BENNETT7,
      note: "The 1950s changes underneath a lot of soul and R&B." },
    { id: "royal", group: "Pop & R&B", name: "Royal road", chords: ["IVmaj7", "V7", "iii7", "vi"], tonality: "major",
      src: { t: "Japan's favourite chord progression and why it works", u: "https://www.youtube.com/watch?v=6aezSL_GvZA" },
      note: "Lush and restless. The iii to vi move pulls hard toward minor." },
    { id: "jttou", group: "Pop & R&B", name: "Just the Two of Us", chords: ["bVImaj7", "V7", "i"], beats: [4, 4, 8], tonality: "minor",
      src: { t: "Songs that use the \"Just The Two Of Us\" chord progression", u: "https://www.youtube.com/watch?v=7vT0RxwL1HE" },
      note: "The core of the New Jack Swing sound. Watch the V7: the key's pentatonic clashes with it." },
    { id: "minor4", group: "Pop & R&B", name: "Minor four", chords: ["IV", "iv", "I"], beats: [4, 4, 8], tonality: "major",
      src: { t: "Songs that use the Minor 4 chord", u: "https://www.youtube.com/watch?v=tStINGVUbWo" },
      note: "IV turns minor for one bar before home. The borrowed chord changes one note." },
    { id: "backdoor", group: "Pop & R&B", name: "Backdoor", chords: ["iv", "bVII7", "I"], beats: [4, 4, 8], tonality: "major",
      src: { t: "Songs that use the Backdoor Progression", u: "https://www.youtube.com/watch?v=s1tDB79UEsQ" },
      note: "The gospel and Stevie Wonder way home: iv to bVII7 instead of V." },
    { id: "twofive", group: "Pop & R&B", name: "2-5-1", chords: ["ii", "V7", "I"], beats: [4, 4, 8], tonality: "major",
      src: { t: "Songs that use 2 5 1 chord progressions", u: "https://www.youtube.com/watch?v=6y-LoytFckI" },
      note: "The jazz and gospel front door home." },
    { id: "aeolian", group: "Pop & R&B", name: "Aeolian vamp", chords: ["i", "bVII", "bVI", "bVII"], tonality: "minor", src: BENNETT7,
      note: "Every chord fits the minor pentatonic. The easiest place to start riffing." },
    { id: "mixo", group: "Rock & blues", name: "Mixolydian vamp", chords: ["I", "bVII", "IV", "I"], tonality: "mixolydian", src: BENNETT7,
      note: "Also called the double plagal. Classic rock's favorite loop." },
    { id: "i5b74", group: "Rock & blues", name: "I–V–♭VII–IV", chords: ["I", "V", "bVII", "IV"], tonality: "mixolydian", src: BENNETT5,
      note: "Rock anthem changes that lean Mixolydian." },
    { id: "i454", group: "Rock & blues", name: "Blues rock I–IV–V–IV", chords: ["I", "IV", "V", "IV"], tonality: "major",
      src: { t: "Tunable: I–IV–V–IV Blues Rock", u: "https://tunableapp.com/chord-progressions/I-IV-V-IV-blues/" },
      note: "Three chords, back and forth. Try it in Blues style too." },
    { id: "ib7", group: "Rock & blues", name: "I–♭VII–I", chords: ["I", "bVII", "I"], beats: [4, 4, 8], tonality: "mixolydian",
      src: { t: "Tunable: I–♭VII–I Blues Rock", u: "https://tunableapp.com/chord-progressions/I-bVII-I-major/" },
      note: "A two-chord rock vamp. Lots of room to riff." },
    { id: "extplagal", group: "Rock & blues", name: "Extended plagal", chords: ["bVI", "bIII", "bVII", "IV", "I"], beats: [4, 4, 4, 4, 8], tonality: "blues", src: OMT,
      note: "A chain of IV-to-I moves falling by 4ths. Minor pentatonic over it is the rock sound." },
    { id: "b6b7", group: "Rock & blues", name: "♭VI–♭VII–I", chords: ["bVI", "bVII", "I"], beats: [4, 4, 8], tonality: "blues", src: OMT,
      note: "The big rock finish. Two borrowed chords climbing home." },
    { id: "epic", group: "Rock & blues", name: "Epic minor", chords: ["i", "bVI", "bIII", "bVII"], tonality: "minor",
      src: { t: "When did the Axis chord progression become so popular?", u: "https://www.youtube.com/watch?v=U8ImkF7FMPw" },
      note: "The Axis chords in their minor rotation, heavy and anthemic." },
    { id: "creep", group: "Rock & blues", name: "Creep", chords: ["I", "III", "IV", "iv"], tonality: "major",
      src: { t: "Songs that use the Creep chord progression", u: "https://www.youtube.com/watch?v=NyiEMdbfjG8" },
      note: "Two surprise chords: a major III and a minor iv. Both bend one note of the scale." },
    { id: "andalusian", group: "Rock & blues", name: "Andalusian cadence", chords: ["i", "bVII", "bVI", "V7"], tonality: "minor", src: BENNETT7,
      note: "Stepping down to a major V. The V is where the minor pentatonic stops working." },
    { id: "blues12", group: "Rock & blues", name: "12-bar blues", chords: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"], tonality: "blues",
      src: { t: "6 common chord progressions and why they work", u: "https://www.youtube.com/watch?v=v3YbEL-_eoI" },
      note: "The blues form. Minor pentatonic over dominant chords, blue notes on purpose." }
  ];

  /* ---- Vocabulary: patterns beyond the five blocks (general, not from the video) ---- */
  const q = .25;
  D.VOCAB = [
    { id: "cas3", name: "Cascade in 3s", kind: "pent", steps: [2, 1, 0, 1, 0, -1, 0, -1, -2, -1, -2, -3], beats: [q, q, q, q, q, q, q, q, q, q, q, 1.25], land: true, c: "var(--pink)",
      desc: "The Quick Dip, repeated one step lower each time. Groups of three against a 4/4 pulse give it a rolling feel." },
    { id: "cas4", name: "Cascade in 4s", kind: "pent", steps: [3, 2, 1, 0, 2, 1, 0, -1, 1, 0, -1, -2], beats: [q, q, q, q, q, q, q, q, q, q, q, 1.25], land: true, c: "var(--orange)",
      desc: "Four-note groups falling down the scale. This is the long run you hear at the end of big phrases." },
    { id: "turn", name: "Pentatonic turn", kind: "pent", steps: [0, 1, 0, -1, 0], beats: [q, q, q, q, 1], land: true, c: "var(--green)",
      desc: "Circle a note: up one, back, down one, back. Small, quick, and everywhere in R&B." },
    { id: "climb", name: "Pentatonic climb", kind: "pent", steps: [-3, -2, -1, 0, 1, 2], beats: [q, q, q, q, q, 1], land: true, c: "var(--blue)",
      desc: "A straight run up the scale into a held note. Use it to lift into a high line." },
    { id: "trip3", name: "Triplet Quick Dip Trip", kind: "pent", steps: [0, -1, -2, -3], beats: [1 / 3, 1 / 3, 1 / 3, 1], land: true, c: "var(--yellow)",
      desc: "Her Quick Dip Trip, regrouped as a triplet. Same notes, lazier and more laid-back." },
    { id: "encl", name: "Enclosure", kind: "encl", land: true, beats: [.5, .5, 1], c: "var(--pink)",
      desc: "Approach the target from a scale step above, then a half step below, then land. It makes any chord tone sound intentional." },
    { id: "blue", name: "Blue-note slide", kind: "semi", ctx: "major", semis: [3, 4, 2, 0], beats: [.125, .375, .25, 1], c: "var(--blue)",
      desc: "Slide from the minor 3rd into the major 3rd, then step down to the root. The classic bluesy scoop over a major chord." },
    { id: "gospel", name: "Gospel descent", kind: "semi", ctx: "major", semis: [12, 9, 7, 4, 2, 0], beats: [q, q, q, q, q, 1], c: "var(--green)",
      desc: "Down the major pentatonic from the octave: 8, 6, 5, 3, 2, 1. The sound of a choir run." },
    { id: "arpm7", name: "Minor 7 arpeggio run", kind: "semi", ctx: "minor", semis: [0, 3, 7, 10, 12, 10, 7, 3, 0], beats: [q, q, q, q, q, q, q, q, 1], c: "var(--orange)",
      desc: "Up and down the chord tones of a minor 7. It trains your ear to hear where the chord lives." },
    { id: "arpmaj7", name: "Major 7 arpeggio run", kind: "semi", ctx: "major", semis: [0, 4, 7, 11, 12, 11, 7, 4, 0], beats: [q, q, q, q, q, q, q, q, 1], c: "var(--yellow)",
      desc: "The same idea over a major 7. The 7th a half step under the octave is the neo-soul color." }
  ];

  D.METHODS = [
    { id: "listen", name: "Listen", desc: "Hear it twice at your tempo." },
    { id: "doo", name: "Doo first", desc: "Three slow rounds on “doo,” then one on “ah.” Consonants keep the notes clean." },
    { id: "chunk", name: "Chunks", desc: "Each half twice, slowly, then the whole thing." },
    { id: "back", name: "Build from the end", desc: "Last two notes, then last three, and so on until you have the whole riff." },
    { id: "accent", name: "Move the accent", desc: "Each round leans on a different note, so no note gets swallowed." },
    { id: "rhythm", name: "Rhythm swap", desc: "As written, straight sixteenths, triplets, then swung." },
    { id: "speed", name: "Speed up", desc: "Four rounds climbing toward 100 bpm." }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = D;
  else { root.VL = root.VL || {}; root.VL.data = D; }
})(typeof window !== "undefined" ? window : globalThis);
