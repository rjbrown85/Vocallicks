/* Chapter 05: Guide. Every explanation lives here so the working screens stay short.
   Riff tips, combo notes, progression notes, styles, and methods come straight from data.js and theory.js. */
(function () {
  const VL = window.VL, $ = VL.$, T = VL.theory, D = VL.data, esc = VL.esc;

  const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`;
  const numerals = p => p.chords.map(x => T.parseNumeral(x).text).join(" – ");

  function sections() {
    return [
      { id: "g-runs", title: "How a run works", body: `
        <p>Every drill opens with a count-in. With Tight spacing that's two clicks, and Roomy gives you the original four. Changes always counts a full bar, since the band needs a bar to settle into its groove.</p>
        <p>A tight round lasts as long as the riff plus one beat of air, rounded up to a whole beat, so a Quick Dip takes two beats instead of a full bar. In echo rounds you get the same stretch of time to sing it back. Roomy keeps every round on whole 4/4 bars, which helps when a riff is brand new and you want time to reset. The key walk's chord takes two beats with Tight spacing and a full bar with Roomy.</p>
        <p>When a run ends, rate it Clean, Almost, or Messy. Ratings feed the log, the Progress table, and the ladder step the daily routine picks. A Clean rating below 100 bpm offers a five-bpm bump. The Next button starts the following step right away: the next ladder step for her five riffs, the next method in the workbench, or the next item in today's routine.</p>
        <p>Everything you can adjust lives in the one Setup drawer. Your lowest and highest notes decide where every riff sits. The riff key and scale drive the Riffs chapter, while the band settings (progression, song key, style, and your part) drive Changes. On the Changes page, the dock along the bottom keeps Play, the progression, key, style, mode, tempo, and riff choice on screen. Changing any of them while the loop plays restarts it with the new setting.</p>` },

      { id: "g-riffs", title: "The five riffs", body: `
        <p>Crystal Cherelle's five building blocks all start from the same home note, and each one has a five-step ladder. Her demo tempo is 100 bpm, so the speed-up step climbs from your tempo toward that.</p>
        <dl class="gl">${D.ORDER.map(k => { const b = D.BLOCKS[k]; return `<div style="--c:${b.c}"><dt><i></i>${esc(b.name)} <span>${esc(b.rhythm)}</span></dt><dd>${esc(b.tip)}</dd></div>`; }).join("")}</dl>
        <h4>The ladder</h4>
        <ol class="gsteps">
          <li><b>Listen.</b> The piano plays it twice at your tempo.</li>
          <li><b>Detached.</b> Four slow rounds on “hee,” every note separate, at 60 percent of your tempo.</li>
          <li><b>Smooth.</b> The same slow tempo on “ah,” with the notes connected.</li>
          <li><b>Speed up.</b> Four rounds climbing from your tempo toward 100 bpm.</li>
          <li><b>Key walk.</b> Up a half step each round until the riff reaches your highest note, then back down.</li>
        </ol>
        <p>Keep riffs light while they're new, and add volume only once they're clean.</p>` },

      { id: "g-walk", title: "Key walk", body: `
        <p>Pick a riff or combo and the range you want it to cover. Each key opens with the chord that fits the riff, then the riff plays as many times as you chose. The walk climbs a half step at a time, and after the top key it comes back down to where it started. It uses the scale and tempo from Setup. If the riff spans more than the range you picked, the Start button stays off until you widen it.</p>` },

      { id: "g-shapes", title: "Move the shape", body: `
        <p>All five riffs are anchored to the same home note. To use them while improvising you need to start a shape anywhere in the scale, so this section runs one shape from each scale step, lowest start first. The home position is the one you learned in the ladder.</p>` },

      { id: "g-combos", title: "Combos", body: `
        <p>Her combinations chain blocks at the pitches you've been practicing, so the join between two blocks often repeats a note or skips one. Get each join clean at the slow tempo before you echo it at your own. In the builder, listen for joins that flow, since she tried a few orders that sounded disconnected.</p>
        <dl class="gl">${D.COMBOS.map(c => `<div><dt>${c.n ? "Combo " + c.n : "Honorable mention"}: ${esc(c.b.map(x => D.BLOCKS[x].name).join(" + "))}</dt><dd>${esc(c.note)}</dd></div>`).join("")}</dl>` },

      { id: "g-progs", title: "The progressions", body: `
        <p>${D.PROGRESSIONS.filter(p => !p.custom).length} loops, grouped by style and decade. The Aeolian vamp and the Axis are the easiest places to start, because one pentatonic covers every chord. The session routine walks through them from easiest to hardest.</p>
        <p><b>Make my own</b> builds a loop of two to eight chords. Pick a feel first (major, minor, Dorian, Mixolydian, or blues), then a chord for each slot: the first group holds the chords that belong to that feel, and the second holds common borrowed chords like ♭VII, iv, or a major V in minor. Each chord gets one bar (two with “2 bars per chord”), and you can hold the last chord twice as long. Your progressions appear under “My progressions,” work with every style, the arranger, and the recorder, and stay in this browser.</p>
        ${[...new Set(D.PROGRESSIONS.filter(p => !p.custom).map(p => p.group))].map(g => `<h4>${esc(g)}</h4><dl class="gl">${D.PROGRESSIONS.filter(p => p.group === g && !p.custom).map(p =>
          `<div><dt>${esc(p.name)} <span>${esc(numerals(p))}</span></dt><dd>${esc(p.note)} ${link(p.src.u, p.src.t)}</dd></div>`).join("")}</dl>`).join("")}` },

      { id: "g-scales", title: "How the scale choice works", body: `
        <p>Every chord implies a mode. A D7 in the key of G is D Mixolydian, which has the same notes as E Aeolian. Riffs use five-note pentatonic slices of that mode, and the slice matters. E minor pentatonic over D7 skips the chord's 3rd (F♯) and ♭7 (C) and includes G, which rubs against F♯. A minor pentatonic, a 5th above the root, sounds bluesy. B minor pentatonic, a 6th above, sounds sweet because it holds the 3rd.</p>
        <p>Over minor 7 chords the whole-step-up idea works well, so E minor pentatonic over Dm7 gives the Dorian color. Over a major V chord in a minor key, like E7 going to Am, the key's pentatonic has G where the chord has G♯. That card gets a clash badge, and the riff lands on the chord's 3rd instead.</p>
        <p><b>One scale for the key</b> keeps a single pentatonic for the whole loop, which is how most singers start. <b>Chord by chord</b> switches the riff scale on every chord, and the flavor picks which slice: Sweet favors the one that holds the 3rd, Bluesy the 5th-above slice (or the blues scale), and Color the more adventurous options like the Dorian whole step up.</p>
        <h4>Styles</h4>
        <p>Styles change the chords themselves, so the cards update when you switch.</p>
        <dl class="gl">${Object.values(T.STYLES).map(s => `<div><dt>${esc(s.name)}</dt><dd>${esc(s.blurb)}</dd></div>`).join("")}</dl>` },

      { id: "g-arrange", title: "The riff lane and the arranger", body: `
        <p>The lane shows one pass of the loop with every riff note as a brick, placed at its real pitch and time. In “One riff, placed for me” mode each riff ends on the downbeat of the next chord, and a dashed outline means the landing note bends a half step outside the scale to reach the chord.</p>
        <p>Switch Riffs to “My arrangement” to place them yourself. Pick a riff from the palette and lock spots light up under the lane. The app checks every half beat and keeps only the spots where the riff fits the chords it sounds over: held notes stay inside each chord's mode and off its avoid notes, quick passing notes stay in the scale, and the last note is always a chord tone.</p>
        <dl class="gl">
          <div><dt><i class="dot gold"></i>Gold spot</dt><dd>The riff lands right on a chord change, on that chord's 3rd or 7th. These are the strongest landings.</dd></div>
          <div><dt><i class="dot green"></i>Green spot</dt><dd>The riff fits and ends on a chord tone somewhere inside a chord.</dd></div>
          <div><dt><span class="chainlink static">link</span></dt><dd>Two riffs chain when the second starts within half a beat of the first one's end and within two half steps of its last note, so they sing as one phrase.</dd></div>
        </dl>
        <p>Pick a riff from the <b>Blocks</b>, <b>Licks</b>, or <b>Runs</b> menu above the lane, then tap any lit spot to drop it in. The riff stays picked, so you can keep tapping spots to add more copies, or press <b>Fill every chord</b> to put it on every chord change where it fits. Pick from any menu to switch riffs, or set the menu back to “Pick…” to put it down. <b>Fill with a mix</b> lands a variety of riffs on alternating changes and links in connecting riffs, and <b>Undo</b> steps back through your edits.</p>
        <p>Drag a placed riff to move it. Select one to nudge it to a higher or lower placement that still fits, jump to the previous or next spot, or remove it. On a keyboard, the arrow keys do the same and Delete removes it. Save an arrangement to find it again in the Session chapter.</p>` },

      { id: "g-cards", title: "Reading a chord card", body: `
        <p>Each card shows the chord's numeral, its name in your key, and its mode. <b>Riff</b> is the pentatonic (or blues scale, or chord tones) to riff from. <b>Land</b> lists the best landing notes in order, guide tones first, with the small label giving the note's role in the chord. <b>Avoid</b> lists scale notes a half step above a chord tone, which are fine in passing but rub if you hold them.</p>
        <p>A pink clash badge means the one-scale choice has a note that fights this chord, so aim for the landing note instead. A blue badge marks a blue note, which in blues and rock is the sound you want. Tap a card to hear the chord and see its notes on the keyboard.</p>` },

      { id: "g-vocab", title: "The licks", body: `
        <p>These are common patterns beyond the five blocks, not from Crystal Cherelle's video. The ones marked “works in Changes” can be placed over a progression.</p>
        <dl class="gl">${D.VOCAB.filter(v => v.cat !== "run").map(v => `<div style="--c:${v.c}"><dt><i></i>${esc(v.name)}</dt><dd>${esc(v.desc)}</dd></div>`).join("")}</dl>` },

      { id: "g-runs2", title: "Scale runs", body: `
        <p>Runs build the evenness and pitch accuracy that fast riffs depend on. They play in your riff key from Setup, mostly in steady eighth notes, so start slow and keep every note the same size and volume before you speed up. The five-note runs use the full natural minor or major scale rather than the pentatonic, so they include the half steps that pentatonic riffs skip.</p>
        <p>The runs marked “works in Changes” can go over a progression. There the five-note run uses the scale that fits each chord, either the key's scale (one scale for the key) or the chord's own mode (chord by chord), and it still has to end on a chord tone. Longer runs span more than one chord, so they find fewer lock spots on fast-changing loops.</p>
        <dl class="gl">${D.VOCAB.filter(v => v.cat === "run").map(v => `<div style="--c:${v.c}"><dt><i></i>${esc(v.name)}</dt><dd>${esc(v.desc)}</dd></div>`).join("")}</dl>` },

      { id: "g-methods", title: "Practice methods", body: `
        <p>The workbench runs any riff, hers or new, in your riff key from Setup. After each method, Next moves to the one that usually comes after it.</p>
        <dl class="gl">${D.METHODS.map(m => `<div><dt>${esc(m.name)}</dt><dd>${esc(m.desc)}</dd></div>`).join("")}</dl>` },

      { id: "g-session", title: "The daily session", body: `
        <p>Every session runs on one progression, chosen at the top as <b>Today's changes</b>. The app suggests one each day, walking from the easiest loops to the hardest, and you can pick any other, including your own. The same progression, key, and style carry through all three parts, and Part 1 plays in that progression's minor pentatonic key, so the blocks you drill are the exact notes you use over the chords a few minutes later.</p>
        <p><b>Part 1, five-block check.</b> All five of her riffs in order, two echo rounds each, at each riff's own tempo. Rate each one and the next starts right away. Three Clean checks in a row raise that riff's tempo by 5 bpm, working toward her 100 bpm. After the five, the riff you rated lowest gets slow detached and smooth rounds; if all five were Clean, that step is skipped.</p>
        <p><b>Part 2, blocks over the changes.</b> <i>Rotate all five</i> gives each chord change the next block in order, so over five loops every block lands on every chord. <i>One riff on every chord</i> drills the riff you pick, and <i>My weakest riff</i> uses the lowest-rated riff from Part 1. The mode ladder plays the riffs for you, then has you sing along with a quiet piano, then echo each loop. On Standard and Long, a second step plays the loop alone while the bar shows which riff lands where, so you sing the placements from memory.</p>
        <p><b>Part 3, runs and licks.</b> The scale walk sings 1-2-3-4-5-4-3-2 on each chord's own scale, so you hear the scale shift from chord to chord. Then the lick of the day: build it from the end, then sing it landing on every chord change. Standard and Long add two loops of free riffing, and Long adds a recorded take. The step count and running time at your current tempos show at the top.</p>
        <p><b>Five-block mastery</b> tracks four levels per riff: 1 at home position slow, 2 Clean at home position at 100 bpm, 3 Clean from any scale note (the Move the shape drill), and 4 Clean over the changes. Your progress for the day is saved, so you can stop and pick up where you left off. Your setup (progression, key, style, Part 2 format and mode, length) sits behind <i>Change today's setup</i>; untick <i>Rate, then keep going</i> there if you want to pause between steps. Tap any step in the part map to jump to it. Mastery, streak, progress, saved arrangements, and the recorder share the tabbed panel below.</p>` },

      { id: "g-record", title: "Recording a take", body: `
        <p>Wear headphones so the piano doesn't leak into your mic twice. The recording mixes the piano with your voice, so you can hear whether each riff landed. It uses your Changes settings, including your arrangement if Riffs is set to “My arrangement.” Takes stay in the tab until you close it, so save the ones you want to keep. The claude.ai preview can't use the microphone, but the GitHub Pages version can.</p>` },

      { id: "g-voice", title: "Voice care", body: `
        <p>Warm up light, keep new riffs quiet and easy, and add volume only once they're clean. Stop if anything feels scratchy or tight, and take a break before you come back to it.</p>` },

      { id: "g-credits", title: "Credits", body: `
        <ul class="gcredits">
          <li>Riffs, names, and combinations: ${link("https://www.youtube.com/watch?v=saWqsqZUy5M", "Master 5 R&B Riffs Every Pro Singer Uses")} by Crystal Cherelle, Indie Artist School. Notes and rhythms from her ${link("https://riffbuilder.indieartistschool.com", "Riff Builder")}. Combination pitches follow Riff Builder, which joins blocks at fixed pitch.</li>
          <li>Progressions: ${link("https://www.youtube.com/playlist?list=PLlx2eo2tD6KpfGmE-MXwcIRQh21neAKsK", "David Bennett's chord progression videos")}, ${link("https://human.libretexts.org/Bookshelves/Music/Music_Theory/Open_Music_Theory_2e_(Gotham_et_al.)/07%3A_Popular_Music/7.08%3A_Blues-Based_Schemas", "Open Music Theory")}, and Tunable. Pentatonic choices over dominant chords: ${link("https://www.premierguitar.com/lessons/alternate-pentatonics", "Premier Guitar, Alternate Pentatonics")}.</li>
          <li>Practice methods draw on ${link("https://www.30daysinger.com/blog/how-to-practice-riffs-and-runs", "30 Day Singer")} and ${link("https://hvsconservatory.com/how-to-do-vocal-runs/", "HVS Conservatory")}.</li>
          <li>Piano: ${link("https://sfzinstruments.github.io/pianos/salamander/", "Salamander Grand Piano")} by Alexander Holm (CC BY 3.0), played through ${link("https://tonejs.github.io/", "Tone.js")}. Fonts: Dela Gothic One, Courier Prime, Permanent Marker.</li>
        </ul>` }
    ];
  }

  function open(id) {
    VL.go("guide");
    const el = document.getElementById(id);
    if (el) setTimeout(() => VL.reveal(el), 30);
  }

  VL.guide = {
    init() {
      const secs = sections();
      $("#guideToc").innerHTML = secs.map(s => `<button type="button" data-tab="${s.id}">${esc(s.title)}</button>`).join("");
      $("#guideBody").innerHTML = secs.map(s => `<section class="panel gsec" id="${s.id}" data-tab="${s.id}"><h3>${esc(s.title)}</h3>${s.body}</section>`).join("");
      VL.makeTabs("guideBody", "#guideToc", "guideTab");
      document.addEventListener("click", e => { const q = e.target.closest("[data-guide]"); if (q) { e.preventDefault(); open(q.dataset.guide); } });
    },
    open
  };
})();
