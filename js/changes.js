/* Chapter 02: Changes. Chord progressions, chord-scale matching, riffs landing on the changes. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;
  const mod = T.mod;

  /* ---------- riffs available over changes ---------- */
  function riffOptions() {
    const blocks = D.ORDER.map(k => ({ id: k, name: D.BLOCKS[k].name, kind: "pent", steps: D.SETS.minor.blocks[k].n, beats: D.SETS.minor.blocks[k].b, vel: D.SETS.minor.blocks[k].v, c: D.BLOCKS[k].c, on: D.BLOCKS[k].on }));
    const vocab = D.VOCAB.filter(v => v.land).map(v => ({ id: v.id, name: v.name, kind: v.kind, steps: v.steps, beats: v.beats, vel: null, c: v.c, on: "var(--ink)" }));
    return { blocks, vocab, all: blocks.concat(vocab) };
  }
  const riffById = id => riffOptions().all.find(r => r.id === id) || riffOptions().all[0];

  /* ---------- compute the whole picture for the current settings ---------- */
  function compute() {
    const prog = D.PROGRESSIONS.find(p => p.id === st.cProg) || D.PROGRESSIONS[0];
    const style = T.STYLES[st.cStyle];
    const base = prog.beats || prog.chords.map(() => 4);
    const beats = base.map(b => b * st.cBars);
    const chords = prog.chords.map(n => T.realize(T.parseNumeral(n), st.cKey, prog.tonality, st.cStyle));
    const n = chords.length;
    const starts = []; let acc = 0; beats.forEach(b => { starts.push(acc); acc += b; });
    const loopBeats = acc;
    const infos = chords.map((c, i) => T.chordScale(c, chords[(i + 1) % n], prog.tonality, st.cKey));
    const keyHome = T.keyHome(prog.tonality, st.cKey);
    const fl = T.keyUsesFlats(st.cKey, prog.tonality);
    const homes = infos.map(info => st.cApproach === "key" ? keyHome : T.pickHome(info, st.cFlavor));
    const clashes = chords.map((c, i) => T.clashes(homes[i], c, infos[i]));
    const lo = st.low, hi = st.cap, center = lo + (hi - lo) * 0.55;

    // riff placements
    const riff = riffById(st.cRiff);
    const placed = [];
    let prevLast = null, lastEnd = -1;
    for (let i = 0; i < n; i++) {
      const use = st.cPlace === "every" || (st.cPlace === "phrase" && i % 2 === 1) || (st.cPlace === "loop" && i === n - 1);
      if (!use) continue;
      const nextInfo = infos[(i + 1) % n], cb = starts[i] + beats[i];
      const rb = riff.kind === "encl" ? D.VOCAB.find(v => v.id === "encl").beats : riff.beats;
      const total = rb.reduce((a, b) => a + b, 0), lastDur = rb[rb.length - 1];
      const startBeat = cb - (total - lastDur);
      if (startBeat < lastEnd + 0.01 || startBeat < -loopBeats) continue;
      const res = riff.kind === "encl" ? T.enclose(homes[i], nextInfo.targets, lo, hi, center)
        : T.landRiff(riff.steps, homes[i], nextInfo.targets, lo, hi, center, prevLast);
      if (!res) continue;
      let bt = startBeat;
      const notes = res.notes.map((m, j) => {
        const o = { beat: bt, dur: rb[j], midi: m, vel: riff.vel ? riff.vel[j] : (j === 0 ? .9 : j === res.notes.length - 1 ? .75 : .8),
          alt: (res.altered && j === res.notes.length - 1) || (res.chromatic && res.chromatic.includes(j)), last: j === res.notes.length - 1 };
        bt += rb[j]; return o;
      });
      placed.push({ i, notes, target: res.t, altered: res.altered, landsOn: (i + 1) % n });
      prevLast = res.notes[res.notes.length - 1];
      lastEnd = cb + lastDur;
    }
    // a riff that starts before the loop must not collide with the one that lands on chord 1 from the end
    if (placed.length > 1 && placed[0].notes[0].beat < 0) {
      const L = placed[placed.length - 1], le = L.notes[L.notes.length - 1];
      if (placed[0].notes[0].beat + loopBeats < le.beat + le.dur) placed.shift();
    }
    return { prog, style, beats, chords, n, starts, loopBeats, infos, keyHome, fl, homes, clashes, lo, hi, riff, placed };
  }

  /* ---------- voicings and comping ---------- */
  function voiceTones(ch, style) {
    const iv = T.QUAL[ch.q].map(x => mod(x));
    let set = [...new Set(iv)];
    const has = x => set.includes(x);
    if (style.voicing === "rootless" && set.length > 3) set = set.filter(x => x !== 0);
    if (style.voicing === "shell") {
      const third = has(4) ? 4 : has(3) ? 3 : null, sev = has(11) ? 11 : has(10) ? 10 : has(9) ? 9 : null;
      set = [third, sev].filter(x => x !== null); if (set.length < 2) set = [0, 7].concat(third !== null ? [third] : []);
    }
    if (set.length > 4 && has(7)) set = set.filter(x => x !== 7);
    if (set.length > 4) set = set.slice(0, 4);
    return set.map(x => mod(ch.root + x));
  }
  function voice(pcs, prev) {
    let best = null;
    const sorted = pcs.slice();
    for (let r = 0; r < sorted.length; r++) {
      const rot = sorted.slice(r).concat(sorted.slice(0, r));
      for (const L of [50, 53, 56]) {
        const out = []; let m = L;
        rot.forEach((pc, i) => { let x = i === 0 ? L : out[i - 1] + 1; while (mod(x) !== pc) x++; out.push(x); });
        if (out[out.length - 1] > 76) continue;
        const mean = out.reduce((a, b) => a + b, 0) / out.length;
        let cost = Math.abs(mean - 62) * 0.4;
        if (prev) { const pm = prev.reduce((a, b) => a + b, 0) / prev.length; cost += Math.abs(mean - pm) * 1.2; }
        if (!best || cost < best.cost) best = { cost, out };
      }
    }
    return best.out;
  }
  const bassOf = pc => 40 + mod(pc - 4);
  const PAT = {
    rock: { c: [[0, .45, .42], [.5, .4, .28], [1, .45, .32], [1.5, .4, .28], [2, .45, .38], [2.5, .4, .28], [3, .45, .32], [3.5, .4, .28]], b: [[0, .9, .55, "r"], [1, .9, .45, "r"], [2, .9, .5, "r"], [3, .9, .45, "r"]] },
    pop: { c: [[0, 1.9, .38], [2, 1.9, .32]], b: [[0, 1.5, .55, "r"], [2, 1, .45, "r"], [3.5, .5, .4, "5"]] },
    rnb: { c: [[0, 2.3, .34], [2.75, 1.1, .26]], b: [[0, 1.4, .55, "r"], [1.75, .25, .35, "o"], [2.5, 1, .45, "r"], [3.75, .25, .4, "a"]] },
    gospel: { c: [[0, 1.4, .4], [1.5, .45, .3], [2, 1.4, .36], [3.5, .45, .3]], b: [[0, 1.5, .58, "r"], [2, .9, .45, "r"], [3, .45, .42, "w"], [3.5, .45, .42, "a"]] },
    blues: { c: [[0, .6, .32], [1.5, .3, .26], [2, .6, .3], [3.5, .3, .26]], b: [[0, .45, .48, 0], [.5, .45, .4, 4], [1, .45, .45, 7], [1.5, .45, .4, 9], [2, .45, .45, 10], [2.5, .45, .4, 9], [3, .45, .45, 7], [3.5, .45, .4, 4]] },
    jazz: { c: [[0, 1.2, .32], [1.5, .4, .28]], b: [[0, .9, .48, "r"], [1, .9, .42, "3"], [2, .9, .45, "5"], [3, .9, .42, "a"]] }
  };
  function swingT(x, swing) { const f = x - Math.floor(x); return swing && Math.abs(f - .5) < 1e-6 ? Math.floor(x) + 2 / 3 : x; }
  function compChord(tl, t0, beats, ch, next, style, b, voicing) {
    const pat = PAT[style.comp];
    const bassR = bassOf(ch.root), nextR = bassOf(next.root);
    const third = T.QUAL[ch.q].includes(3) ? 3 : 4;
    for (let bar = 0; bar < beats; bar += 4) {
      const lenBar = Math.min(4, beats - bar);
      pat.c.forEach(([x, d, v]) => { if (x >= lenBar) return; tl.notes(t0 + (bar + swingT(x, style.swing)) * b, voicing, Math.min(d, lenBar - x) * b, v, .012); });
      pat.b.forEach(([x, d, v, kind]) => {
        if (x >= lenBar) return;
        const lastBar = bar + 4 >= beats;
        let m;
        if (typeof kind === "number") m = bassR + (kind === 4 ? third : kind);
        else if (kind === "r") m = bassR;
        else if (kind === "o") m = bassR + 12;
        else if (kind === "5") m = bassR + 7;
        else if (kind === "3") m = bassR + third;
        else if (kind === "a") m = lastBar ? nextR - 1 : bassR + 7;
        else if (kind === "w") m = lastBar ? nextR - 2 : bassR + 5;
        tl.note(t0 + (bar + swingT(x, style.swing)) * b, m, Math.min(d, lenBar - x) * b, v);
      });
    }
  }

  /* ---------- building and running the plan ---------- */
  function buildPlan(opts = {}) {
    const C = compute();
    const b = 60 / st.tempo, tl = VL.audio.timeline();
    const mode = opts.mode || st.cMode;
    const loops = opts.loops || st.cLoops;
    for (let i = 0; i < 4; i++) { tl.click(i * b, i === 0, false); const k = i; tl.ui(i * b, () => VL.bar.status("Count-in", `${k + 1} of 4 · ${C.prog.name}`)); }
    const t0 = 4 * b;
    let prev = null;
    const voicings = C.chords.map(ch => (prev = voice(voiceTones(ch, C.style), prev)));
    const lane = $("#cLane");
    let tagT = 0;
    for (let p = 0; p < loops; p++) {
      const base = t0 + p * C.loopBeats * b;
      const riffPass = mode === "listen" || mode === "along" || (mode === "echo" && p % 2 === 0);
      const yourPass = mode === "echo" && p % 2 === 1;
      C.chords.forEach((ch, i) => {
        const next = C.chords[(i + 1) % C.n];
        compChord(tl, base + C.starts[i] * b, C.beats[i], ch, next, C.style, b, voicings[i]);
        for (let k = 0; k < C.beats[i]; k++) tl.click(base + (C.starts[i] + k) * b, k % 4 === 0, true);
        const land = C.infos[(i + 1) % C.n].targets[0];
        const main = mode === "free" ? "Your riff" : yourPass ? "Your turn" : mode === "along" ? "Sing along" : "Listen";
        const detail = `Loop ${p + 1} of ${loops} · ${T.chordName(ch, C.fl)} · riff from ${homeName(C.homes[i], C.fl)} · aim for ${cs(next, land.pc, C.fl)} on ${T.chordName(next, C.fl)}`;
        tl.ui(base + C.starts[i] * b, () => { markChord(i); VL.bar.status(main, detail, yourPass || mode === "free"); });
      });
      if (riffPass) C.placed.forEach((pl, pi) => pl.notes.forEach((nt, j) => {
        const t = base + nt.beat * b;
        if (t < t0 - 1e-6) return;
        tl.note(t, nt.midi, nt.dur * b * .92, nt.vel * (mode === "along" ? .55 : 1));
        const idx = laneIndex(C, pi, j);
        tl.ui(t, () => VL.hit(lane, idx, true)); tl.ui(t + nt.dur * b * .85, () => VL.hit(lane, idx, false));
      }));
      tagT = base + C.loopBeats * b;
    }
    // resolve to the first chord once at the end
    compChord(tl, tagT, 4, C.chords[0], C.chords[0], C.style, b, voicings[0]);
    tl.ui(tagT, () => { markChord(0); VL.bar.status("Home", T.chordName(C.chords[0], C.fl)); });
    tl.end = tagT + 4 * b;
    const modeTxt = { listen: "listen", along: "sing along", echo: "echo", free: "free riff" }[mode];
    return {
      tl, title: `${C.prog.name}, ${C.style.name}: ${modeTxt}`, bumpable: mode !== "listen",
      keyText: `${T.spell(st.cKey, C.fl)} ${T.TONALITY[C.prog.tonality].label}`, tempoText: `${st.tempo} bpm`,
      meta: { chapter: "changes", item: "prog:" + C.prog.id, step: mode, bpm: st.tempo },
      after: () => markChord(-1)
    };
  }
  function laneIndex(C, pi, j) { let k = 0; for (let x = 0; x < pi; x++) k += C.placed[x].notes.length; return k + j; }
  const cs = (ch, pc, fl) => T.spellRel(ch.root, T.spell(ch.root, fl), pc, ch.fam === "dim" || ch.fam === "hdim");
  function homeName(h, fl) {
    if (h.kind === "arp") return `${T.spell(h.minorRoot, fl)} chord tones`;
    if (h.kind === "blues") return `${T.spell(h.minorRoot, fl)} blues scale`;
    return `${T.spell(h.minorRoot, fl)} minor pentatonic`;
  }

  /* ---------- drawing ---------- */
  function markChord(i) {
    document.querySelectorAll("#cCards .ccard").forEach((c, k) => c.classList.toggle("now", k === i));
    document.querySelectorAll("#cLane .lchord").forEach((c, k) => c.classList.toggle("now", k === i));
    if (i >= 0) { current = i; drawMap(lastC, i); }
  }
  let lastC = null, current = 0;

  function draw() {
    const C = lastC = compute();
    const fl = C.fl;
    $("#cProgNote").innerHTML = `<b>${C.prog.chords.map(x => T.parseNumeral(x).text).join(" – ")}</b> in ${T.spell(st.cKey, fl)} ${T.TONALITY[C.prog.tonality].label}. ${VL.esc(C.prog.note)} <span class="src">Source: <a href="${C.prog.src.u}" target="_blank" rel="noopener">${VL.esc(C.prog.src.t)}</a></span>`;
    $("#cStyleNote").textContent = C.style.blurb;
    $("#cApproachNote").textContent = st.cApproach === "key"
      ? `One scale for the whole loop: ${homeName(C.keyHome, fl)}. ${C.keyHome.why}`
      : `A new scale on every chord, picked for a ${T.FLAVORS[st.cFlavor].toLowerCase()} sound. This is the gospel and jazz way.`;
    $("#cFlavorWrap").hidden = st.cApproach === "key";

    // chord cards
    const cards = $("#cCards"); cards.innerHTML = "";
    C.chords.forEach((ch, i) => {
      const info = C.infos[i], home = C.homes[i], next = C.chords[(i + 1) % C.n];
      const clash = C.clashes[i];
      const hard = clash.filter(c => c.hard), soft = clash.filter(c => !c.hard);
      let sticker = "";
      if (st.cApproach === "key" && hard.length) {
        sticker = C.keyHome.blues
          ? `<span class="sticker blue">blue note on purpose</span>`
          : `<span class="sticker pink">watch this chord</span>`;
      }
      const clashTxt = hard.length ? (C.keyHome.blues && st.cApproach === "key"
        ? `Your scale's ${hard.map(c => T.spell(c.pc, fl)).join(", ")} rubs against the chord's ${hard.map(c => cs(ch, c.against, fl)).join(", ")}. In blues and rock that rub is the sound.`
        : `Your scale's ${hard.map(c => T.spell(c.pc, fl)).join(", ")} clashes with ${hard.map(c => cs(ch, c.against, fl)).join(", ")} in this chord. Land on ${cs(ch, info.targets[0].pc, fl)} instead.`) : "";
      const card = document.createElement("button");
      card.type = "button"; card.className = "ccard"; card.setAttribute("aria-label", `Hear ${T.chordName(ch, fl)} and show its notes`);
      card.innerHTML = `${sticker}<span class="cnum">${VL.esc(ch.num.text)}</span><span class="csym">${VL.esc(T.chordName(ch, fl))}</span>
        <span class="cmode">${T.spell(ch.root, fl)} ${VL.esc(info.modeName)}</span>
        <span class="crow"><b>Riff from</b> ${VL.esc(homeName(home, fl))}${home.tag && home.tag !== "Key" ? ` · ${VL.esc(home.tag.toLowerCase())}` : ""}</span>
        <span class="crow"><b>Land on</b> ${info.targets.slice(0, 3).map(t => `${cs(ch, t.pc, fl)} (${t.label})`).join(", ")}</span>
        ${info.avoid.length ? `<span class="crow"><b>Don't hold</b> ${info.avoid.map(a => `${cs(ch, a.pc, fl)} (${a.label})`).join(", ")}</span>` : ""}
        ${clashTxt ? `<span class="crow clash">${VL.esc(clashTxt)}</span>` : ""}
        <span class="crow nextline">Next: ${VL.esc(T.chordName(next, fl))}</span>`;
      card.onclick = () => { current = i; markChordStatic(i); audition(ch, C); };
      cards.appendChild(card);
    });
    drawLane(C);
    drawMap(C, Math.min(current, C.n - 1));
    markChordStatic(Math.min(current, C.n - 1));
    const riffTxt = C.placed.length
      ? `${C.riff.name} lands ${C.placed.length} time${C.placed.length > 1 ? "s" : ""} per loop.${C.placed.some(p => p.altered) ? " Notes with a dashed outline bend a half step to reach the next chord." : ""}`
      : `${C.riff.name} is too long for these chord lengths. Try 2 bars per chord or a shorter riff.`;
    $("#cRiffNote").textContent = riffTxt;
  }
  function markChordStatic(i) {
    document.querySelectorAll("#cCards .ccard").forEach((c, k) => c.classList.toggle("sel", k === i));
    if (lastC) drawMap(lastC, i);
  }
  function audition(ch, C) {
    if (VL.audio.isRunning()) return;
    const tl = VL.audio.timeline(), b = 60 / st.tempo;
    const v = voice(voiceTones(ch, C.style), null);
    tl.note(0, bassOf(ch.root), 2.4, .5); tl.notes(0, v, 2.4, .42, .02);
    tl.end = 2.6;
    VL.audio.run({ tl, title: T.chordName(ch, C.fl), noRate: true });
    VL.bar.status(T.chordName(ch, C.fl), C.infos[C.chords.indexOf(ch)].modeName);
  }

  function drawLane(C) {
    const lane = $("#cLane"); lane.innerHTML = "";
    const avail = lane.parentElement.clientWidth - 4, px = Math.max(34, avail > 0 ? avail / C.loopBeats : 34), stepPx = 7, lo = C.lo, hi = C.hi;
    const H = (hi - lo) * stepPx + 46;
    lane.style.width = (C.loopBeats * px) + "px"; lane.style.height = (H + 34) + "px";
    C.chords.forEach((ch, i) => {
      const seg = document.createElement("div"); seg.className = "lchord";
      seg.style.left = (C.starts[i] * px) + "px"; seg.style.width = (C.beats[i] * px) + "px";
      seg.innerHTML = `<span>${VL.esc(T.chordName(ch, C.fl))}</span>`;
      lane.appendChild(seg);
    });
    C.placed.forEach(pl => pl.notes.forEach(nt => {
      const x = ((nt.beat % C.loopBeats) + C.loopBeats) % C.loopBeats;
      const b = document.createElement("div"); b.className = "brick lbrick" + (nt.alt ? " alt" : "");
      b.style.setProperty("--c", C.riff.c); b.style.setProperty("--on", C.riff.on);
      b.style.left = (x * px + 1) + "px"; b.style.width = Math.max(10, nt.dur * px - 2) + "px";
      b.style.bottom = ((nt.midi - lo) * stepPx + 4) + "px";
      b.style.right = "auto";
      b.textContent = nt.dur * px > 18 ? T.spell(nt.midi, C.fl) : "";
      b.title = VL.pitchName(nt.midi) + (nt.last ? " (landing note)" : "");
      lane.appendChild(b);
    }));
  }

  /* keyboard map of the current chord */
  function drawMap(C, i) {
    const el = $("#cMap"); if (!el || !C) return;
    const info = C.infos[i], home = C.homes[i], ch = C.chords[i];
    const lo = C.lo - (C.lo % 12 === 0 ? 0 : 0), hi = C.hi;
    el.innerHTML = "";
    const whites = []; for (let m = lo; m <= hi; m++) if (![1, 3, 6, 8, 10].includes(mod(m))) whites.push(m);
    const w = 100 / whites.length;
    const tset = info.targets.slice(0, 3).map(t => t.pc), aset = info.avoid.map(a => a.pc);
    const cls = m => {
      const pc = mod(m); const c = [];
      if (home.pcs.includes(pc)) c.push("in");
      if (tset.includes(pc)) c.push("tgt");
      if (aset.includes(pc)) c.push("avd");
      if (!info.modePcs.includes(pc) && home.pcs.includes(pc)) c.push("rub");
      return c.join(" ");
    };
    whites.forEach(m => {
      const k = document.createElement("div"); k.className = "wk " + cls(m);
      k.innerHTML = `<span>${T.spell(m, C.fl)}</span>`; el.appendChild(k);
    });
    for (let m = lo; m <= hi; m++) {
      if (![1, 3, 6, 8, 10].includes(mod(m))) continue;
      const idx = whites.indexOf(m - 1); if (idx < 0) continue;
      const k = document.createElement("div"); k.className = "bk " + cls(m);
      k.style.left = ((idx + 1) * w - w * .32) + "%"; k.style.width = (w * .64) + "%";
      k.innerHTML = `<span>${T.spell(m, C.fl)}</span>`; el.appendChild(k);
    }
    $("#cMapTitle").textContent = `${T.chordName(ch, C.fl)}: ${homeName(home, C.fl)} over ${T.spell(ch.root, C.fl)} ${info.modeName}`;
  }

  /* ---------- controls ---------- */
  function buildControls() {
    const groups = [...new Set(D.PROGRESSIONS.map(p => p.group))];
    VL.select($("#cProg"), groups.map(g => ({ group: g, items: D.PROGRESSIONS.filter(p => p.group === g).map(p => ({ value: p.id, label: `${p.name} (${p.chords.map(x => T.parseNumeral(x).text).join("–")})` })) })), st.cProg);
    VL.select($("#cKey"), T.KEYNAMES.map((k, i) => ({ value: i, label: k })), st.cKey);
    VL.select($("#cStyle"), Object.entries(T.STYLES).map(([id, s]) => ({ value: id, label: s.name })), st.cStyle);
    const R = riffOptions();
    VL.select($("#cRiff"), [{ group: "Her five blocks", items: R.blocks.map(r => ({ value: r.id, label: r.name })) }, { group: "Vocabulary", items: R.vocab.map(r => ({ value: r.id, label: r.name })) }], st.cRiff);
    [["#cProg", "cProg"], ["#cKey", "cKey", 1], ["#cStyle", "cStyle"], ["#cBars", "cBars", 1], ["#cLoops", "cLoops", 1], ["#cMode", "cMode"], ["#cApproach", "cApproach"], ["#cFlavor", "cFlavor"], ["#cRiff", "cRiff"], ["#cPlace", "cPlace"]]
      .forEach(([id, key, num]) => {
        const el = $(id); el.value = st[key];
        el.addEventListener("change", e => { st[key] = num ? +e.target.value : e.target.value; if (key === "cProg") current = 0; if (VL.audio.isRunning()) VL.audio.stop(true); VL.changed(); });
      });
    $("#cPlay").onclick = () => VL.audio.run(buildPlan());
  }

  VL.changes = {
    init() { buildControls(); draw(); VL.onSettings(draw); VL.whenShown("changes", draw); let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (lastC) drawLane(lastC); }, 200); }); },
    buildPlan,
    runPreset(p) { Object.assign(st, p); VL.changed(); VL.go("changes"); setTimeout(() => VL.audio.run(buildPlan()), 50); },
    compute
  };
})();
