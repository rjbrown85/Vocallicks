/* Chapter 02: Changes. Progressions, chord-scale matching, auto riffs, and the riff arranger. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;
  const mod = T.mod;

  /* ---------- riffs available over changes ---------- */
  function riffOptions() {
    const blocks = D.ORDER.map(k => ({ id: k, name: D.BLOCKS[k].name, kind: "pent", steps: D.SETS.minor.blocks[k].n, beats: D.SETS.minor.blocks[k].b, vel: D.SETS.minor.blocks[k].v, c: D.BLOCKS[k].c, on: D.BLOCKS[k].on }));
    const mk = v => ({ id: v.id, name: v.changesName || v.name, kind: v.kind, steps: v.steps, beats: v.beats, vel: null, c: v.c, on: "var(--ink)" });
    const vocab = D.VOCAB.filter(v => v.land && v.cat !== "run").map(mk);
    const runs = D.VOCAB.filter(v => v.land && v.cat === "run").map(mk);
    return { blocks, vocab, runs, all: blocks.concat(vocab, runs) };
  }
  const RIFFS = riffOptions();
  const riffById = id => RIFFS.all.find(r => r.id === id) || RIFFS.all[0];
  const velOf = (r, j, n) => r.vel ? r.vel[j] : (j === 0 ? .9 : j === n - 1 ? .75 : .8);
  const SUGGEST_POOL = ["qd", "sl", "sw", "qdt", "skip", "turn", "trip3", "climb"];

  /* ---------- arrangements (working copy per progression + saved list) ---------- */
  const WORKKEY = "vl-arr-work", SAVEKEY = "vl-arr-saved";
  let work = {}, saved = [];
  try { work = JSON.parse(localStorage.getItem(WORKKEY)) || {}; } catch (e) {}
  try { saved = JSON.parse(localStorage.getItem(SAVEKEY)) || []; } catch (e) {}
  const persist = () => { try { localStorage.setItem(WORKKEY, JSON.stringify(work)); localStorage.setItem(SAVEKEY, JSON.stringify(saved)); } catch (e) {} };
  const items = () => (work[st.cProg] = work[st.cProg] || []);
  const setItems = arr => { work[st.cProg] = arr; persist(); };

  /* ---------- your own progressions (stored in this browser, merged into the list) ---------- */
  const CUSTOMKEY = "vl-custom-progs";
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem(CUSTOMKEY)) || []; } catch (e) {}
  customs = customs.filter(c => { try { c.chords.forEach(T.parseNumeral); return c.chords.length >= 2 && T.TONALITY[c.tonality]; } catch (e) { return false; } });
  function mergeCustoms() {
    for (let i = D.PROGRESSIONS.length - 1; i >= 0; i--) if (D.PROGRESSIONS[i].custom) D.PROGRESSIONS.splice(i, 1);
    customs.forEach(c => D.PROGRESSIONS.push(Object.assign({ group: "My progressions", custom: true, note: "Your own progression.", src: null }, c)));
  }
  mergeCustoms();
  const saveCustoms = () => { try { localStorage.setItem(CUSTOMKEY, JSON.stringify(customs)); } catch (e) {} };

  /* ---------- compute everything for the current settings ---------- */
  function compute() {
    const prog = D.PROGRESSIONS.find(p => p.id === st.cProg) || D.PROGRESSIONS[0];
    const style = T.STYLES[st.cStyle];
    const ctx = T.loopContext(prog, { key: st.cKey, style: st.cStyle, approach: st.cApproach, flavor: st.cFlavor, lo: st.low, hi: st.cap, bars: st.cBars });
    const { beats, chords, n, starts, loopBeats, infos, keyHome, homes, lo, hi, center } = ctx;
    const fl = T.keyUsesFlats(st.cKey, prog.tonality);
    const clashes = chords.map((c, i) => T.clashes(homes[i], c, infos[i]));
    const riff = riffById(st.cRiff);
    let placed = [], invalid = 0;

    if (st.cSource === "mine") {
      const its = items().slice().sort((a, b) => a.start - b.start);
      its.forEach((it, idx) => {
        const r = riffById(it.rid);
        const prev = placed[placed.length - 1];
        const prevLast = prev && it.start - prev.span[1] <= 0.5 + 1e-6 && it.start >= prev.span[1] - 1e-6 ? prev.lastMidi : null;
        const pl = T.placeItem(r, it.start, ctx, prevLast, it.nudge || 0);
        if (!pl) { invalid++; return; }
        const span = T.riffSpan(pl);
        if (prev && span[0] < prev.span[1] - 1e-6) { invalid++; return; }
        placed.push({ item: it, riff: r, c: r.c, on: r.on, rank: pl.rank, target: pl.target, landChord: pl.landChord, span, lastMidi: pl.lastMidi,
          chain: prevLast != null && Math.abs(pl.first - prevLast) <= 2, nudgeMin: pl.nudgeMin, nudgeMax: pl.nudgeMax,
          notes: pl.notes.map((nt, j) => Object.assign({}, nt, { vel: velOf(r, j, pl.notes.length) })) });
      });
    } else {
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
          : T.landRiff(riff.steps, riff.kind === "scale" ? { pcs: T.scalePcs(ctx, i) } : homes[i], nextInfo.targets, lo, hi, center, prevLast);
        if (!res) continue;
        let bt = startBeat;
        const notes = res.notes.map((m, j) => {
          const o = { beat: bt, dur: rb[j], midi: m, vel: velOf(riff, j, res.notes.length),
            alt: (res.altered && j === res.notes.length - 1) || (res.chromatic && res.chromatic.includes(j)), last: j === res.notes.length - 1 };
          bt += rb[j]; return o;
        });
        placed.push({ riff, c: riff.c, on: riff.on, notes, target: res.t, altered: res.altered, span: [notes[0].beat, cb + lastDur], lastMidi: res.notes[res.notes.length - 1] });
        prevLast = res.notes[res.notes.length - 1];
        lastEnd = cb + lastDur;
      }
      if (placed.length > 1 && placed[0].notes[0].beat < 0) {
        const L = placed[placed.length - 1], le = L.notes[L.notes.length - 1];
        if (placed[0].notes[0].beat + loopBeats < le.beat + le.dur) placed.shift();
      }
    }
    return { prog, style, ctx, beats, chords, n, starts, loopBeats, infos, keyHome, fl, homes, clashes, lo, hi, riff, placed, invalid };
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
    for (let r = 0; r < pcs.length; r++) {
      const rot = pcs.slice(r).concat(pcs.slice(0, r));
      for (const L of [50, 53, 56]) {
        const out = [];
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
    compChord(tl, tagT, 4, C.chords[0], C.chords[0], C.style, b, voicings[0]);
    tl.ui(tagT, () => { markChord(0); VL.bar.status("Home", T.chordName(C.chords[0], C.fl)); });
    tl.end = tagT + 4 * b;
    const modeTxt = { listen: "listen", along: "sing along", echo: "echo", free: "free riff" }[mode];
    const what = st.cSource === "mine" ? "my arrangement" : C.riff.name;
    return {
      tl, title: `${C.prog.name}, ${C.style.name}, ${what}: ${modeTxt}`, bumpable: mode !== "listen",
      keyText: `${T.spell(st.cKey, C.fl)} ${T.TONALITY[C.prog.tonality].label}`, tempoText: `${st.tempo} bpm`,
      meta: { chapter: "changes", item: "prog:" + C.prog.id, step: mode, bpm: st.tempo },
      after: () => markChord(-1)
    };
  }
  function laneIndex(C, pi, j) { let k = 0; for (let x = 0; x < pi; x++) k += C.placed[x].notes.length; return k + j; }
  const cs = (ch, pc, fl) => T.spellRel(ch.root, T.spell(ch.root, fl), pc, ch.fam === "dim" || ch.fam === "hdim");
  function homeName(h, fl, short) {
    if (h.kind === "arp") return `${T.spell(h.minorRoot, fl)} chord tones`;
    if (h.kind === "blues") return `${T.spell(h.minorRoot, fl)} blues${short ? "" : " scale"}`;
    return `${T.spell(h.minorRoot, fl)} ${short ? "min pent" : "minor pentatonic"}`;
  }

  /* ---------- drawing ---------- */
  let lastC = null, current = 0;
  function markChord(i) {
    document.querySelectorAll("#cCards .ccard").forEach((c, k) => c.classList.toggle("now", k === i));
    document.querySelectorAll("#cLane .lchord").forEach((c, k) => c.classList.toggle("now", k === i));
    if (i >= 0) { current = i; drawMap(lastC, i); }
  }
  function draw() {
    const C = lastC = compute();
    const fl = C.fl;
    const scaleTxt = st.cApproach === "key" ? `one scale: ${homeName(C.keyHome, fl)}` : `chord by chord, ${T.FLAVORS[st.cFlavor].toLowerCase()}`;
    $("#cSummary").innerHTML = `<b>${C.prog.chords.map(x => T.parseNumeral(x).text).join(" – ")}</b> in ${T.spell(st.cKey, fl)} ${T.TONALITY[C.prog.tonality].label} · ${VL.esc(C.style.name)} · ${VL.esc(scaleTxt)}`;
    $("#cFlavorWrap").hidden = st.cApproach === "key";
    $("#pbEdit").hidden = !C.prog.custom;
    const mine = st.cSource === "mine";
    $("#cRiffWrap").hidden = mine; $("#cPlaceWrap").hidden = mine; $("#arranger").hidden = !mine; $("#aBelow").hidden = !mine; $("#cToMine").hidden = mine;

    const cards = $("#cCards"); cards.innerHTML = "";
    C.chords.forEach((ch, i) => {
      const info = C.infos[i], home = C.homes[i];
      const hard = C.clashes[i].filter(c => c.hard);
      const blue = C.keyHome.blues && st.cApproach === "key";
      const clashShort = hard.map(c => `${T.spell(c.pc, fl)} vs ${cs(ch, c.against, fl)}`).join(", ");
      const card = document.createElement("button");
      card.type = "button"; card.className = "ccard";
      card.setAttribute("aria-label", `Hear ${T.chordName(ch, fl)}`);
      if (hard.length) card.title = blue ? `Blue note: ${clashShort}. In blues and rock the rub is the sound.` : `Clash: ${clashShort}. Land on ${cs(ch, info.targets[0].pc, fl)} instead.`;
      card.innerHTML = `${hard.length && st.cApproach === "key" ? `<span class="sticker ${blue ? "blue" : "pink"}">${blue ? "blue note" : "clash"}: ${VL.esc(clashShort)}</span>` : ""}
        <span class="cnum">${VL.esc(ch.num.text)}</span><span class="csym">${VL.esc(T.chordName(ch, fl))}</span>
        <span class="cmode">${T.spell(ch.root, fl)} ${VL.esc(info.modeName)}</span>
        <span class="crow"><b>Riff</b> ${VL.esc(homeName(home, fl, true))}</span>
        <span class="crow"><b>Land</b> ${info.targets.slice(0, 3).map(t => `${cs(ch, t.pc, fl)}<sup>${t.label}</sup>`).join(" · ")}</span>
        ${info.avoid.length ? `<span class="crow"><b>Avoid</b> ${info.avoid.map(a => `${cs(ch, a.pc, fl)}<sup>${a.label}</sup>`).join(" · ")}</span>` : ""}`;
      card.onclick = () => { current = i; markChordStatic(i); audition(ch, C); };
      cards.appendChild(card);
    });
    drawLane(C);
    drawMap(C, Math.min(current, C.n - 1));
    markChordStatic(Math.min(current, C.n - 1));
    drawRiffNote(C);
    if (mine) drawArrangerPanel(C);
  }
  function drawRiffNote(C) {
    let t;
    if (st.cSource === "mine") {
      const g = C.placed.filter(p => p.rank === "gold").length, ch = C.placed.filter(p => p.chain).length;
      t = C.placed.length ? `${C.placed.length} riff${C.placed.length > 1 ? "s" : ""} · ${g} land on a change · ${ch} chained` : "Pick a riff below, then drag it onto the lane or tap a lit spot.";
      if (C.invalid) t += ` · ${C.invalid} no longer fit${C.invalid > 1 ? "" : "s"} these settings`;
    } else {
      t = C.placed.length ? `${C.riff.name} lands ${C.placed.length}× per loop.${C.placed.some(p => p.altered) ? " Dashed = bent a half step." : ""}` : `${C.riff.name} is too long for these chord lengths. Try 2 bars per chord.`;
    }
    $("#cRiffNote").textContent = t;
  }
  function markChordStatic(i) {
    document.querySelectorAll("#cCards .ccard").forEach((c, k) => c.classList.toggle("sel", k === i));
    if (lastC) drawMap(lastC, i);
  }
  function audition(ch, C) {
    if (VL.audio.isRunning()) return;
    const tl = VL.audio.timeline();
    const v = voice(voiceTones(ch, C.style), null);
    tl.note(0, bassOf(ch.root), 2.4, .5); tl.notes(0, v, 2.4, .42, .02);
    tl.end = 2.6;
    VL.audio.run({ tl, title: T.chordName(ch, C.fl), noRate: true });
    VL.bar.status(T.chordName(ch, C.fl), C.infos[C.chords.indexOf(ch)].modeName);
  }

  /* ---------- the riff lane (and arranger surface) ---------- */
  const STEP_PX = 7, SPOT_H = 30;
  let geom = null;               // {px, lo, H}
  let selRid = null;             // palette selection
  let selItem = null;            // selected arranged item (object ref)
  let preview = null;            // {start, cand}
  let drag = null;               // {rid, item, orig, moved, x0, y0}

  function laneGeom(C) {
    const lane = $("#cLane");
    const avail = lane.parentElement.clientWidth - 4;
    const px = Math.max(34, avail > 0 ? avail / C.loopBeats : 34);
    const H = (C.hi - C.lo) * STEP_PX + 46;
    return { px, lo: C.lo, H, bottom: st.cSource === "mine" ? SPOT_H : 0 };
  }
  const brickBottom = m => ((m - geom.lo) * STEP_PX + 4 + geom.bottom) + "px";

  function drawLane(C) {
    const lane = $("#cLane"); lane.innerHTML = "";
    geom = laneGeom(C);
    const { px } = geom, mine = st.cSource === "mine";
    lane.style.width = (C.loopBeats * px) + "px"; lane.style.height = (geom.H + 34 + geom.bottom) + "px";
    lane.classList.toggle("editing", mine);
    C.chords.forEach((ch, i) => {
      const seg = document.createElement("div"); seg.className = "lchord";
      seg.style.left = (C.starts[i] * px) + "px"; seg.style.width = (C.beats[i] * px) + "px";
      seg.innerHTML = `<span>${VL.esc(T.chordName(ch, C.fl))}</span>`;
      lane.appendChild(seg);
    });
    C.placed.forEach(pl => pl.notes.forEach(nt => {
      const x = ((nt.beat % C.loopBeats) + C.loopBeats) % C.loopBeats;
      const b = document.createElement("div"); b.className = "brick lbrick" + (nt.alt ? " alt" : "") + (pl.item && pl.item === selItem ? " picked" : "");
      b.style.setProperty("--c", pl.c); b.style.setProperty("--on", pl.on);
      b.style.left = (x * px + 1) + "px"; b.style.width = Math.max(10, nt.dur * px - 2) + "px";
      b.style.bottom = brickBottom(nt.midi); b.style.right = "auto";
      b.textContent = nt.dur * px > 18 ? T.spell(nt.midi, C.fl) : "";
      b.title = VL.pitchName(nt.midi) + (nt.last ? " (landing note)" : "");
      lane.appendChild(b);
    }));
    if (!mine) return;
    // chain links and grab handles
    C.placed.forEach((pl, pi) => {
      const lo = Math.min(...pl.notes.map(n => n.midi)), hi = Math.max(...pl.notes.map(n => n.midi));
      if (pl.chain) {
        const prev = C.placed[pi - 1];
        const lk = document.createElement("span"); lk.className = "chainlink"; lk.textContent = "link";
        lk.style.left = ((prev.span[1] + pl.span[0]) / 2 * px - 18) + "px";
        lk.style.bottom = brickBottom(Math.max(prev.lastMidi, pl.notes[0].midi) + 3);
        lane.appendChild(lk);
      }
      const h = document.createElement("button"); h.type = "button"; h.className = "grab" + (pl.item === selItem ? " sel" : "") + (pl.rank === "gold" ? " gold" : "");
      h.style.left = (pl.span[0] * px - 2) + "px"; h.style.width = ((pl.span[1] - pl.span[0]) * px + 4) + "px";
      h.style.bottom = ((lo - geom.lo) * STEP_PX + geom.bottom) + "px"; h.style.height = ((hi - lo) * STEP_PX + 32) + "px";
      const land = pl.target ? `${cs(C.chords[pl.landChord], pl.target.pc, C.fl)} (${pl.target.label}) of ${T.chordName(C.chords[pl.landChord], C.fl)}` : "";
      h.setAttribute("aria-label", `${pl.riff.name} at beat ${pl.span[0] + 1}, lands on ${land}. Arrow keys move it, Delete removes it.`);
      h.onpointerdown = e => startItemDrag(e, pl.item);
      h.onkeydown = e => itemKey(e, pl.item);
      h.onfocus = () => { if (selItem !== pl.item) { selItem = pl.item; selRid = null; refreshArranger(); setTimeout(() => focusGrab(pl.item), 0); } };
      lane.appendChild(h);
    });
    drawSpots(C);
  }
  function focusGrab(it) {
    const C = lastC; const i = C.placed.findIndex(p => p.item === it);
    const g = document.querySelectorAll("#cLane .grab")[i]; if (g) g.focus({ preventScroll: true });
  }
  function occupiedExcept(C, except) {
    return C.placed.filter(p => p.item !== except).map(p => ({ start: p.span[0], end: p.span[1], lastMidi: p.lastMidi }));
  }
  let spotCache = [];
  function drawSpots(C) {
    const lane = $("#cLane");
    lane.querySelectorAll(".spotrow,.ghost").forEach(e => e.remove());
    const rid = drag ? drag.rid : selRid;
    spotCache = [];
    const row = document.createElement("div"); row.className = "spotrow"; row.style.height = SPOT_H + "px";
    lane.appendChild(row);
    if (!rid) { row.innerHTML = `<span class="spothint">Pick a riff to see where it locks in.</span>`; return; }
    const r = riffById(rid);
    spotCache = T.lockSpots(r, C.ctx, occupiedExcept(C, drag ? drag.item : null));
    if (!spotCache.length) { row.innerHTML = `<span class="spothint">No free spot fits ${VL.esc(r.name)} here. Remove a riff or try another.</span>`; return; }
    spotCache.forEach(sp => {
      const d = document.createElement("button"); d.type = "button"; d.className = "spot " + sp.rank;
      d.style.left = (sp.start * geom.px - 7) + "px";
      const lc = C.chords[sp.best.landChord];
      d.setAttribute("aria-label", `Place ${r.name} at beat ${sp.start + 1}, lands on ${cs(lc, sp.best.target.pc, C.fl)} (${sp.best.target.label}) of ${T.chordName(lc, C.fl)}${sp.rank === "gold" ? ", right on the change" : ""}`);
      d.title = d.getAttribute("aria-label");
      d.onmouseenter = d.onfocus = () => showGhost(sp, r);
      d.onmouseleave = d.onblur = () => { if (!drag) clearGhost(); };
      d.onclick = () => placeAt(r.id, sp.start, null);
      row.appendChild(d);
    });
  }
  function showGhost(sp, r) {
    clearGhost();
    preview = sp;
    const lane = $("#cLane"), C = lastC;
    sp.best.notes.forEach(nt => {
      const g = document.createElement("div"); g.className = "brick lbrick ghost";
      g.style.setProperty("--c", r.c); g.style.left = (nt.beat * geom.px + 1) + "px"; g.style.width = Math.max(10, nt.dur * geom.px - 2) + "px";
      g.style.bottom = brickBottom(nt.midi); g.style.right = "auto"; g.textContent = nt.dur * geom.px > 18 ? T.spell(nt.midi, C.fl) : "";
      lane.appendChild(g);
    });
    lane.querySelectorAll(".spot").forEach(d => d.classList.toggle("on", Math.abs(parseFloat(d.style.left) - (sp.start * geom.px - 7)) < 0.5));
  }
  function clearGhost() { preview = null; document.querySelectorAll("#cLane .ghost").forEach(e => e.remove()); document.querySelectorAll("#cLane .spot.on").forEach(d => d.classList.remove("on")); }

  function placeAt(rid, start, moving) {
    const arr = items().filter(it => it !== moving);
    const it = moving ? Object.assign(moving, { start, nudge: 0 }) : { rid, start, nudge: 0 };
    arr.push(it);
    setItems(arr);
    selItem = it; selRid = null; preview = null;
    if (VL.audio.isRunning()) VL.audio.stop(true);
    draw();
    focusGrab(it);
  }

  /* drag from the palette */
  function startPaletteDrag(e, rid) {
    if (e.button !== undefined && e.button !== 0) return;
    drag = { rid, item: null, moved: false, x0: e.clientX, y0: e.clientY, pending: true };
    bindDragDoc();
  }
  function startItemDrag(e, it) {
    if (e.button !== undefined && e.button !== 0) return;
    selItem = it; selRid = null;
    drag = { rid: it.rid, item: it, moved: false, x0: e.clientX, y0: e.clientY, pending: true };
    bindDragDoc();
  }
  function bindDragDoc() {
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd, { once: true });
    document.addEventListener("pointercancel", onDragEnd, { once: true });
  }
  function onDragMove(e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
    if (!drag.moved) { drag.moved = true; document.body.classList.add("dragging"); if (drag.pending) { drag.pending = false; if (!drag.item) { selRid = drag.rid; selItem = null; refreshArranger(); } else drawSpots(lastC); } }
    const lane = $("#cLane"), rect = lane.getBoundingClientRect();
    const inside = e.clientX >= rect.left - 20 && e.clientX <= rect.right + 20 && e.clientY >= rect.top - 40 && e.clientY <= rect.bottom + 40;
    if (!inside || !spotCache.length) { clearGhost(); return; }
    const r = riffById(drag.rid), lead = r.beats.reduce((a, b) => a + b, 0) / 2;
    const beat = (e.clientX - rect.left) / geom.px - lead;
    let best = null;
    spotCache.forEach(sp => { const d = Math.abs(sp.start - beat); if (d <= 2.5 && (!best || d < best.d)) best = { d, sp }; });
    if (best) showGhost(best.sp, r); else clearGhost();
  }
  function onDragEnd() {
    document.removeEventListener("pointermove", onDragMove);
    document.body.classList.remove("dragging");
    const d = drag; drag = null;
    if (!d) return;
    if (d.moved && preview) { placeAt(d.rid, preview.start, d.item); return; }
    preview = null;
    refreshArranger();
    if (d.item) focusGrab(d.item);
  }

  /* keyboard for arranged riffs */
  function itemKey(e, it) {
    const C = lastC, pl = C.placed.find(p => p.item === it);
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeItem(it); return; }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); nudge(it, e.key === "ArrowUp" ? 1 : -1); return; }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const spots = T.lockSpots(riffById(it.rid), C.ctx, occupiedExcept(C, it));
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextSp = dir > 0 ? spots.find(s => s.start > it.start + 1e-6) : spots.slice().reverse().find(s => s.start < it.start - 1e-6);
      if (nextSp) placeAt(it.rid, nextSp.start, it);
    }
  }
  function nudge(it, d) {
    const pl = lastC.placed.find(p => p.item === it); if (!pl) return;
    const nv = Math.max(pl.nudgeMin, Math.min(pl.nudgeMax, (it.nudge || 0) + d));
    if (nv === (it.nudge || 0)) return;
    it.nudge = nv; setItems(items()); draw(); focusGrab(it);
  }
  function removeItem(it) { setItems(items().filter(x => x !== it)); selItem = null; draw(); }

  /* ---------- arranger panel ---------- */
  function buildArranger() {
    const pal = $("#aPalette"); pal.innerHTML = "";
    [["Blocks", RIFFS.blocks], ["Licks", RIFFS.vocab], ["Runs", RIFFS.runs]].forEach(([g, list]) => {
      const lab = document.createElement("span"); lab.className = "plabel"; lab.textContent = g; pal.appendChild(lab);
      list.forEach(r => {
        const b = document.createElement("button"); b.type = "button"; b.className = "chip pchip";
        b.textContent = r.name; b.dataset.rid = r.id; b.style.setProperty("--c", r.c);
        b.onpointerdown = e => startPaletteDrag(e, r.id);
        b.onclick = () => { selRid = selRid === r.id ? null : r.id; selItem = null; refreshArranger(); };
        pal.appendChild(b);
      });
    });
    $("#aSuggest").onclick = () => {
      const C = lastC;
      const pool = RIFFS.all.filter(r => SUGGEST_POOL.includes(r.id));
      const existing = C.placed.map(p => ({ rid: p.item.rid, start: p.item.start, nudge: p.item.nudge, span: p.span, lastMidi: p.lastMidi }));
      setItems(T.suggestChain(pool, C.ctx, existing)); selItem = null; draw();
    };
    $("#aFromAuto").onclick = copyAuto;
    $("#cToMine").onclick = () => { copyAuto(); };
    let armed = false;
    $("#aClear").onclick = e => {
      const b = e.currentTarget;
      if (!armed) { armed = true; b.textContent = "Tap again to clear"; setTimeout(() => { armed = false; b.textContent = "Clear"; }, 3000); return; }
      armed = false; b.textContent = "Clear"; setItems([]); selItem = null; draw();
    };
    $("#aUp").onclick = () => selItem && nudge(selItem, 1);
    $("#aDown").onclick = () => selItem && nudge(selItem, -1);
    $("#aLeft").onclick = () => selItem && itemKey({ key: "ArrowLeft", preventDefault() {} }, selItem);
    $("#aRight").onclick = () => selItem && itemKey({ key: "ArrowRight", preventDefault() {} }, selItem);
    $("#aRemove").onclick = () => selItem && removeItem(selItem);
    $("#aSave").onclick = saveArrangement;
    $("#aLoad").onclick = () => { const s = saved.find(x => x.id === $("#aSaved").value); if (s) loadArrangement(s); };
    $("#aDelete").onclick = () => { saved = saved.filter(x => x.id !== $("#aSaved").value); persist(); drawSaved(); VL.changed(); };
  }
  function copyAuto() {
    st.cSource = "auto";
    const A = compute(); st.cSource = "mine";
    const arr = A.placed.filter(p => p.notes[0].beat >= 0).map(p => ({ rid: A.riff.id, start: p.notes[0].beat, nudge: 0 }));
    setItems(arr); selItem = null; VL.changed();
    $("#cSource").value = "mine";
  }
  function refreshArranger() {
    document.querySelectorAll("#aPalette .pchip").forEach(b => b.setAttribute("aria-pressed", b.dataset.rid === selRid));
    if (lastC) { drawLane(lastC); drawArrangerPanel(lastC); }
  }
  function drawArrangerPanel(C) {
    document.querySelectorAll("#aPalette .pchip").forEach(b => b.setAttribute("aria-pressed", b.dataset.rid === selRid));
    const pl = C.placed.find(p => p.item === selItem);
    const tools = $("#aTools");
    tools.hidden = !pl;
    if (pl) {
      const lc = C.chords[pl.landChord];
      $("#aSel").textContent = `${pl.riff.name}: beat ${pl.span[0] + 1}, lands on ${cs(lc, pl.target.pc, C.fl)} (${pl.target.label}) of ${T.chordName(lc, C.fl)}${pl.rank === "gold" ? " on the change" : ""}${pl.chain ? ", linked" : ""}`;
      $("#aUp").disabled = (selItem.nudge || 0) >= pl.nudgeMax; $("#aDown").disabled = (selItem.nudge || 0) <= pl.nudgeMin;
    }
    drawSaved();
  }
  function drawSaved() {
    const sel = $("#aSaved"); if (!sel) return;
    VL.select(sel, saved.length ? saved.map(s => ({ value: s.id, label: s.name })) : [{ value: "", label: "Nothing saved yet" }]);
    $("#aLoad").disabled = $("#aDelete").disabled = !saved.length;
  }
  function saveArrangement() {
    const C = lastC, its = items();
    if (!its.length) { $("#aName").placeholder = "Place a riff first"; return; }
    const name = ($("#aName").value || "").trim() || `${C.prog.name} in ${T.KEYNAMES[st.cKey]}, ${C.style.name}`;
    saved.unshift({ id: String(Date.now()), name, prog: st.cProg, key: st.cKey, style: st.cStyle, approach: st.cApproach, flavor: st.cFlavor, bars: st.cBars, items: its.map(i => ({ rid: i.rid, start: i.start, nudge: i.nudge || 0 })), ts: Date.now() });
    saved = saved.slice(0, 40); persist(); $("#aName").value = ""; drawSaved(); VL.changed();
  }
  function loadArrangement(s) {
    Object.assign(st, { cProg: s.prog, cKey: s.key, cStyle: s.style, cApproach: s.approach, cFlavor: s.flavor, cBars: s.bars, cSource: "mine" });
    work[s.prog] = s.items.map(i => Object.assign({}, i)); persist();
    selItem = null; syncControls(); VL.changed();
  }

  /* keyboard map of the current chord */
  function drawMap(C, i) {
    const el = $("#cMap"); if (!el || !C) return;
    const info = C.infos[i], home = C.homes[i], ch = C.chords[i];
    const lo = C.lo, hi = C.hi;
    el.innerHTML = "";
    const whites = []; for (let m = lo; m <= hi; m++) if (![1, 3, 6, 8, 10].includes(mod(m))) whites.push(m);
    const w = 100 / whites.length;
    const tset = info.targets.slice(0, 3).map(t => t.pc), aset = info.avoid.map(a => a.pc);
    const cls = m => {
      const pc = mod(m), c = [];
      if (home.pcs.includes(pc)) c.push("in");
      if (tset.includes(pc)) c.push("tgt");
      if (aset.includes(pc)) c.push("avd");
      if (!info.modePcs.includes(pc) && home.pcs.includes(pc)) c.push("rub");
      return c.join(" ");
    };
    whites.forEach(m => { const k = document.createElement("div"); k.className = "wk " + cls(m); k.innerHTML = `<span>${T.spell(m, C.fl)}</span>`; el.appendChild(k); });
    for (let m = lo; m <= hi; m++) {
      if (![1, 3, 6, 8, 10].includes(mod(m))) continue;
      const idx = whites.indexOf(m - 1); if (idx < 0) continue;
      const k = document.createElement("div"); k.className = "bk " + cls(m);
      k.style.left = ((idx + 1) * w - w * .32) + "%"; k.style.width = (w * .64) + "%";
      k.innerHTML = `<span>${T.spell(m, C.fl)}</span>`; el.appendChild(k);
    }
    $("#cMapTitle").textContent = `${T.chordName(ch, C.fl)}: ${homeName(home, C.fl)} over ${T.spell(ch.root, C.fl)} ${info.modeName}`;
  }

  /* ---------- progression builder ---------- */
  const PALETTE = {
    major: { key: ["I", "ii", "iii", "IV", "V", "vi", "vii°"], more: ["V7", "II", "III", "VI", "bIII", "bVI", "bVII", "iv", "i"] },
    minor: { key: ["i", "ii°", "bIII", "iv", "v", "bVI", "bVII"], more: ["V", "V7", "IV", "bII", "I"] },
    dorian: { key: ["i", "ii", "bIII", "IV", "v", "vi°", "bVII"], more: ["V", "V7", "iv", "bVI"] },
    mixolydian: { key: ["I", "ii", "iii°", "IV", "v", "vi", "bVII"], more: ["V", "V7", "iv", "bIII", "bVI"] },
    blues: { key: ["I7", "IV7", "V7"], more: ["I", "IV", "V", "bIII", "bVI", "bVII", "i", "iv", "ii", "vi"] }
  };
  const STARTERS = { major: ["I", "vi", "IV", "V"], minor: ["i", "bVI", "bIII", "bVII"], dorian: ["i", "IV", "i", "bVII"], mixolydian: ["I", "bVII", "IV", "I"], blues: ["I7", "IV7", "I7", "V7"] };
  const FAMSUF = { maj: "", min: "m", dom: "7", dim: "°", hdim: "ø7" };
  let pb = null;       // {id, name, tonality, chords, hold}
  const letterName = (num, fl) => T.spell(mod(st.cKey + T.parseNumeral(num).deg), fl) + FAMSUF[T.parseNumeral(num).fam];
  function openBuilder(prog) {
    pb = prog ? { id: prog.id, name: prog.name, tonality: prog.tonality, chords: prog.chords.slice(), hold: !!(prog.beats && prog.beats[prog.beats.length - 1] > 4) }
      : { id: null, name: "", tonality: "major", chords: STARTERS.major.slice(), hold: false };
    $("#pbName").value = pb.name; $("#pbTon").value = pb.tonality; $("#pbHold").checked = pb.hold;
    $("#pbRemove").hidden = !pb.id; $("#pbPanel").hidden = false;
    drawBuilder();
  }
  function closeBuilder() { pb = null; $("#pbPanel").hidden = true; }
  function drawBuilder() {
    if (!pb) return;
    const fl = T.keyUsesFlats(st.cKey, pb.tonality), pal = PALETTE[pb.tonality];
    const slots = $("#pbSlots"); slots.innerHTML = "";
    pb.chords.forEach((c, i) => {
      const lab = document.createElement("label"); lab.textContent = `Chord ${i + 1}`;
      const sel = document.createElement("select"); lab.appendChild(sel);
      const opt = n => ({ value: n, label: `${T.parseNumeral(n).text}  (${letterName(n, fl)})` });
      const extra = pal.key.concat(pal.more).includes(c) ? [] : [c];
      VL.select(sel, [{ group: "In the key", items: pal.key.map(opt) }, { group: "Borrowed & other", items: pal.more.concat(extra).map(opt) }], c);
      sel.onchange = () => { pb.chords[i] = sel.value; drawPreview(); };
      slots.appendChild(lab);
    });
    $("#pbAdd").disabled = pb.chords.length >= 8; $("#pbDel").disabled = pb.chords.length <= 2;
    drawPreview();
  }
  function drawPreview() {
    const fl = T.keyUsesFlats(st.cKey, pb.tonality);
    $("#pbPreview").innerHTML = `<b>${pb.chords.map(c => T.parseNumeral(c).text).join(" – ")}</b> · ${VL.esc(pb.chords.map(c => letterName(c, fl)).join(" – "))} in ${T.spell(st.cKey, fl)} ${T.TONALITY[pb.tonality].label}${pb.hold ? " · last chord 2 bars" : ""}`;
  }
  function hearBuilder() {
    if (!pb) return;
    if (VL.audio.isRunning()) VL.audio.stop(true);
    const style = T.STYLES[st.cStyle], b = 60 / st.tempo, tl = VL.audio.timeline();
    const chords = pb.chords.map(n => T.realize(T.parseNumeral(n), st.cKey, pb.tonality, st.cStyle));
    const fl = T.keyUsesFlats(st.cKey, pb.tonality);
    let t = 0, prev = null;
    chords.forEach((ch, i) => {
      const len = (pb.hold && i === chords.length - 1 ? 8 : 4) * b;
      const v = prev = voice(voiceTones(ch, style), prev);
      tl.note(t, bassOf(ch.root), len * .95, .5); tl.notes(t, v, len * .95, .42, .02);
      tl.ui(t, () => VL.bar.status("Your progression", `${T.parseNumeral(pb.chords[i]).text} · ${T.chordName(ch, fl)}`));
      t += len;
    });
    tl.end = t;
    VL.audio.run({ tl, title: "Your progression", noRate: true });
  }
  let rmArmed = false;
  function bindBuilder() {
    $("#pbNew").onclick = () => openBuilder(null);
    $("#pbEdit").onclick = () => openBuilder(D.PROGRESSIONS.find(p => p.id === st.cProg));
    $("#pbClose").onclick = closeBuilder;
    $("#pbName").oninput = e => { pb.name = e.target.value; };
    $("#pbTon").onchange = e => {
      const ton = e.target.value;
      pb.chords = pb.chords.map((c, i) => STARTERS[ton][i % 4]);
      pb.tonality = ton; drawBuilder();
    };
    $("#pbHold").onchange = e => { pb.hold = e.target.checked; drawPreview(); };
    $("#pbAdd").onclick = () => { if (pb.chords.length < 8) { pb.chords.push(PALETTE[pb.tonality].key[0]); drawBuilder(); } };
    $("#pbDel").onclick = () => { if (pb.chords.length > 2) { pb.chords.pop(); drawBuilder(); } };
    $("#pbHear").onclick = hearBuilder;
    $("#pbSave").onclick = () => {
      const id = pb.id || "my-" + Date.now();
      const name = pb.name.trim() || `My ${pb.chords.map(c => T.parseNumeral(c).text).join("–")}`;
      const rec = { id, name, chords: pb.chords.slice(), tonality: pb.tonality };
      if (pb.hold) rec.beats = pb.chords.map((c, i) => i === pb.chords.length - 1 ? 8 : 4);
      const i = customs.findIndex(c => c.id === id);
      if (i >= 0) customs[i] = rec; else customs.push(rec);
      if (pb.id) delete work[id];
      saveCustoms(); persist(); mergeCustoms(); buildProgSelect();
      closeBuilder();
      if (VL.audio.isRunning()) VL.audio.stop(true);
      st.cProg = id; current = 0; selItem = null; VL.changed();
    };
    $("#pbRemove").onclick = e => {
      const b = e.currentTarget;
      if (!rmArmed) { rmArmed = true; b.textContent = "Tap again to delete"; setTimeout(() => { rmArmed = false; b.textContent = "Delete"; }, 3000); return; }
      rmArmed = false; b.textContent = "Delete";
      customs = customs.filter(c => c.id !== pb.id); delete work[pb.id];
      saveCustoms(); persist(); mergeCustoms(); buildProgSelect();
      if (st.cProg === pb.id) st.cProg = "axis";
      closeBuilder(); current = 0; selItem = null; VL.changed();
    };
  }
  function buildProgSelect() {
    const groups = [...new Set(D.PROGRESSIONS.map(p => p.group))];
    VL.select($("#cProg"), groups.map(g => ({ group: g, items: D.PROGRESSIONS.filter(p => p.group === g).map(p => ({ value: p.id, label: `${p.name} (${p.chords.map(x => T.parseNumeral(x).text).join("–")})` })) })), st.cProg);
  }

  /* ---------- controls ---------- */
  const CONTROLS = [["#cProg", "cProg"], ["#cKey", "cKey", 1], ["#cStyle", "cStyle"], ["#cBars", "cBars", 1], ["#cLoops", "cLoops", 1], ["#cMode", "cMode"], ["#cApproach", "cApproach"], ["#cFlavor", "cFlavor"], ["#cRiff", "cRiff"], ["#cPlace", "cPlace"], ["#cSource", "cSource"]];
  function syncControls() { CONTROLS.forEach(([id, key]) => { $(id).value = st[key]; }); }
  function buildControls() {
    buildProgSelect();
    VL.select($("#cKey"), T.KEYNAMES.map((k, i) => ({ value: i, label: k })), st.cKey);
    VL.select($("#cStyle"), Object.entries(T.STYLES).map(([id, s]) => ({ value: id, label: s.name })), st.cStyle);
    VL.select($("#cRiff"), [{ group: "Her five blocks", items: RIFFS.blocks.map(r => ({ value: r.id, label: r.name })) }, { group: "Vocabulary", items: RIFFS.vocab.map(r => ({ value: r.id, label: r.name })) }, { group: "Scale runs", items: RIFFS.runs.map(r => ({ value: r.id, label: r.name })) }], st.cRiff);
    CONTROLS.forEach(([id, key, num]) => {
      const el = $(id); el.value = st[key];
      el.addEventListener("change", e => { st[key] = num ? +e.target.value : e.target.value; if (key === "cProg") { current = 0; selItem = null; } if (VL.audio.isRunning()) VL.audio.stop(true); VL.changed(); });
    });
    $("#cPlay").onclick = () => VL.audio.run(buildPlan());
  }

  VL.changes = {
    init() {
      buildControls(); buildArranger(); bindBuilder(); draw();
      VL.onSettings(() => { syncControls(); draw(); if (pb) drawBuilder(); });
      VL.whenShown("changes", draw);
      let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (lastC) drawLane(lastC); }, 200); });
    },
    buildPlan,
    runPreset(p) { Object.assign(st, p); VL.changed(); VL.go("changes"); setTimeout(() => VL.audio.run(buildPlan()), 50); },
    openArranger(prog) { Object.assign(st, { cProg: prog, cSource: "mine" }); VL.changed(); VL.go("changes"); setTimeout(() => $("#laneHead").scrollIntoView({ block: "start" }), 60); },
    saved: () => saved,
    editSaved(id) { const s = saved.find(x => x.id === id); if (!s) return; loadArrangement(s); VL.go("changes"); setTimeout(() => $("#laneHead").scrollIntoView({ block: "start" }), 60); },
    playSaved(id, mode) { const s = saved.find(x => x.id === id); if (!s) return; loadArrangement(s); VL.go("changes"); setTimeout(() => VL.audio.run(buildPlan({ mode: mode || "listen" })), 60); },
    compute
  };
})();
