/* Chapter 01: Blocks. The original Riff Blocks drills, unchanged in behavior. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;
  const { SETS, BLOCKS, ORDER, COMBOS } = D;
  const { SHARP, FLAT, DEG } = T;

  const S = () => SETS[st.set];
  function stepToMidi(set, step) { const n = set.scale.length, oct = Math.floor(step / n), i = step - oct * n; return set.tonic + 12 * oct + set.scale[i]; }
  function keyShift() { const set = S(); let s = ((st.key - set.tonic % 12) + 12) % 12; if (s > 6) s -= 12; return s + (+st.oct); }
  function tonicPc(shift) { return ((S().tonic + shift) % 12 + 12) % 12; }
  function flats(shift) { const pc = tonicPc(shift); return S().minor ? [0, 2, 3, 5, 7, 10].includes(pc) : [0, 1, 3, 5, 8, 10].includes(pc); }
  function pn(m, shift) { return (flats(shift) ? FLAT : SHARP)[((m % 12) + 12) % 12]; }
  function nn(m, shift) { return pn(m, shift) + (Math.floor(m / 12) - 1); }
  function capName() { return SHARP[st.cap % 12] + (Math.floor(st.cap / 12) - 1); }
  function deg(m, shift) { return DEG[((m - (S().tonic + shift)) % 12 + 12) % 12]; }
  function keyLabel(shift) { return (flats(shift) ? FLAT : SHARP)[tonicPc(shift)] + " " + S().name; }
  function notesFor(k, shift, stepShift = 0, setKey = st.set) {
    const set = SETS[setKey], B = set.blocks[k];
    return B.n.map((x, i) => {
      const step = Array.isArray(x) ? x[0] : x, ch = Array.isArray(x) ? x[1] : 0;
      return { midi: stepToMidi(set, step + stepShift) + ch + shift, beats: B.b[i], vel: B.v[i], block: k, acc: k === "skip" && i === 0 };
    });
  }
  const top = ns => Math.max(...ns.map(n => n.midi));
  function renderStair(el, notes, shift) {
    VL.renderStair(el, notes.map(n => ({ midi: n.midi, beats: n.beats, color: BLOCKS[n.block].c, on: BLOCKS[n.block].on, acc: n.acc })), m => pn(m, shift));
  }
  const run = plan => { plan.meta = Object.assign({ chapter: "blocks" }, plan.meta || {}); VL.audio.runReps(plan); };

  function rep(notes, tempo, o = {}) {
    return { notes, tempo, echo: o.solo ? false : (st.mode === "echo"), solo: !!o.solo, staccato: !!o.stacc, target: o.target, tonic: o.tonic,
      label: o.label || "", syll: o.syll, onStart: o.onStart };
  }
  function slowT() { return Math.max(40, Math.round(st.tempo * .6)); }
  function ladderPlan(k, step) {
    const sh = keyShift(), Tm = st.tempo, slow = slowT(), m = BLOCKS[k], tgt = document.querySelector(`#riff-${k} .stair`);
    const base = notesFor(k, sh), tonic = S().tonic + sh, o = { target: tgt, tonic };
    let reps = [], title = "", bumpable = false, after = null;
    if (step === 1) { title = `${m.name}: listen`; reps = [rep(base, Tm, { ...o, solo: true, label: `${Tm} bpm` }), rep(base, Tm, { ...o, solo: true, label: `${Tm} bpm` })]; }
    if (step === 2) { title = `${m.name}: detached`; for (let i = 0; i < 4; i++) reps.push(rep(base, slow, { ...o, stacc: true, syll: "“hee”", label: `detached, ${slow} bpm` })); }
    if (step === 3) { title = `${m.name}: smooth`; for (let i = 0; i < 4; i++) reps.push(rep(base, slow, { ...o, syll: "“ah”", label: `smooth, ${slow} bpm` })); }
    if (step === 4) {
      title = `${m.name}: speed up`; bumpable = true;
      const goal = Math.max(Tm, 100); for (let i = 0; i < 4; i++) { const tt = Math.round(Tm + (goal - Tm) * i / 3); reps.push(rep(base, tt, { ...o, syll: "“ah”", label: `${tt} bpm` })); }
    }
    if (step === 5) {
      title = `${m.name}: key walk`; bumpable = true;
      const shifts = [sh]; let s = sh; while (top(notesFor(k, s + 1)) <= st.cap && shifts.length < 9) { s++; shifts.push(s); }
      for (let x = s - 1; x >= sh; x--) shifts.push(x);
      reps = shifts.map(x => rep(notesFor(k, x), Tm, { target: tgt, tonic: S().tonic + x, syll: "“ah”", label: `key of ${keyLabel(x).split(" ")[0]}`, onStart: () => drawRiff(k, x) }));
      after = () => drawRiff(k, keyShift());
    }
    const tempos = [...new Set(reps.map(r => r.tempo))];
    return { title, reps, bumpable, after, keyText: keyLabel(sh), tempoText: tempos.length > 1 ? `${tempos[0]} to ${tempos[tempos.length - 1]} bpm` : `${tempos[0]} bpm`,
      meta: { item: "block:" + k, step, bpm: tempos[tempos.length - 1] } };
  }

  /* ---------- riffs ---------- */
  const STEPS = [
    ["Listen", "The piano plays it twice. Just listen."],
    ["Detached", "On “hee,” every note separate, slow."],
    ["Smooth", "On “ah,” notes connected, same slow speed."],
    ["Speed up", "Four rounds climbing toward 100 bpm."],
    ["Key walk", "Up a half step each round to your top note, then back down."]
  ];
  function buildRiffs() {
    const list = $("#riffList");
    ORDER.forEach(k => {
      const m = BLOCKS[k], a = document.createElement("article"); a.className = "panel taped riff"; a.id = "riff-" + k;
      a.style.setProperty("--c", m.c);
      a.innerHTML = `<div class="riff-head"><span class="num" aria-hidden="true">${m.num}</span><h3>${m.name}</h3></div>
        <div class="stair-wrap"><div class="stair"></div></div>
        <dl class="facts"><div><dt>Notes</dt><dd class="f-notes"></dd></div><div><dt>Scale steps</dt><dd class="f-degs"></dd></div><div><dt>Rhythm</dt><dd>${m.rhythm}</dd></div></dl>
        <p class="tip">${m.tip}</p>
        <ol class="ladder">${STEPS.map((s, i) => `<li><button type="button" class="step" data-step="${i + 1}"><span class="n">${i + 1}</span><b>${s[0]}</b><span class="d">${s[1]}</span></button></li>`).join("")}</ol>`;
      a.querySelectorAll(".step").forEach(b => b.onclick = () => run(ladderPlan(k, +b.dataset.step)));
      list.appendChild(a);
    });
  }
  function drawRiff(k, shift) {
    const a = $("#riff-" + k), ns = notesFor(k, shift);
    renderStair(a.querySelector(".stair"), ns, shift);
    a.querySelector(".f-notes").textContent = ns.map(n => nn(n.midi, shift)).join(" ");
    a.querySelector(".f-degs").textContent = ns.map(n => deg(n.midi, shift)).join(" ");
    a.querySelector('[data-step="2"] .d').textContent = `On “hee,” every note separate, at ${slowT()} bpm.`;
    a.querySelector('[data-step="3"] .d').textContent = `On “ah,” notes connected, at ${slowT()} bpm.`;
  }

  /* ---------- shapes ---------- */
  let shape = "qd";
  const SHAPES = ["qd", "sl", "sw", "qdt"];
  function shapeSetKey() { return S().shapeSet || st.set; }
  function positions() { return SETS[shapeSetKey()].scale.length === 5 ? [-2, -1, 0, 1, 2] : [-3, -2, -1, 0, 1, 2, 3]; }
  function buildShapeChips() {
    const c = $("#shapeChips"); c.innerHTML = "";
    SHAPES.forEach(k => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = BLOCKS[k].name;
      b.style.setProperty("--c", BLOCKS[k].c); b.setAttribute("aria-pressed", k === shape);
      b.onclick = () => { shape = k; buildShapeChips(); drawShapes(); }; c.appendChild(b);
    });
  }
  function drawShapes() {
    const g = $("#shapeGrid"), sh = keyShift(); g.innerHTML = "";
    positions().forEach(p => {
      const ns = notesFor(shape, sh, p, shapeSetKey()), f = ns[0];
      const d = document.createElement("div"); d.className = "mini";
      d.innerHTML = `${p === 0 ? '<span class="sticker">home position</span>' : ""}<h3>Starts on ${deg(f.midi, sh)} (${nn(f.midi, sh)})</h3>
        <div class="stair-wrap"><div class="stair"></div></div><div class="row"><button class="btn" type="button">Echo twice</button></div>`;
      renderStair(d.querySelector(".stair"), ns, sh);
      d.querySelector("button").onclick = () => {
        const tg = d.querySelector(".stair"), o = { target: tg, tonic: S().tonic + sh, label: `starts on ${deg(f.midi, sh)}`, syll: "“ah”" };
        run({ title: `${BLOCKS[shape].name} from ${deg(f.midi, sh)}`, reps: [rep(ns, st.tempo, o), rep(ns, st.tempo, o)], bumpable: true, keyText: keyLabel(sh), tempoText: `${st.tempo} bpm`, meta: { item: "shape:" + shape, bpm: st.tempo } });
      };
      g.appendChild(d);
    });
  }
  function runAllShapes() {
    const sh = keyShift(), minis = [...document.querySelectorAll("#shapeGrid .stair")];
    const reps = positions().map((p, i) => {
      const ns = notesFor(shape, sh, p, shapeSetKey());
      return rep(ns, st.tempo, { target: minis[i], tonic: S().tonic + sh, label: `starts on ${deg(ns[0].midi, sh)}`, syll: "“ah”" });
    });
    run({ title: `${BLOCKS[shape].name}, every position`, reps, bumpable: true, keyText: keyLabel(sh), tempoText: `${st.tempo} bpm`, meta: { item: "shape:" + shape, bpm: st.tempo } });
  }

  /* ---------- combos ---------- */
  function comboNotes(blocks, sh) { return blocks.flatMap(b => notesFor(b, sh)); }
  function comboName(b) { return b.map(x => BLOCKS[x].name).join(" + "); }
  function legend(blocks) { return `<div class="legend">${[...new Set(blocks)].map(b => `<span style="--c:${BLOCKS[b].c}"><i></i>${BLOCKS[b].name}</span>`).join("")}</div>`; }
  function comboPlan(blocks, kind, tgt, label) {
    const sh = keyShift(), ns = comboNotes(blocks, sh), o = { target: tgt, tonic: S().tonic + sh }, slow = slowT(); let reps = [];
    if (kind === "listen") reps = [rep(ns, st.tempo, { ...o, solo: true, label: `${st.tempo} bpm` })];
    if (kind === "slow") for (let i = 0; i < 4; i++) reps.push(rep(ns, slow, { ...o, syll: "“ah”", label: `slow, ${slow} bpm` }));
    if (kind === "echo") for (let i = 0; i < 4; i++) reps.push(rep(ns, st.tempo, { ...o, syll: "“ah”", label: `${st.tempo} bpm` }));
    const tp = reps[0].tempo;
    return { title: `${label}: ${kind === "listen" ? "listen" : kind === "slow" ? "slow echo" : "echo"}`, reps, bumpable: kind !== "listen", keyText: keyLabel(sh), tempoText: `${tp} bpm`,
      meta: { item: "combo:" + blocks.join("+"), bpm: tp } };
  }
  function buildCombos() {
    const list = $("#comboList"); list.innerHTML = "";
    COMBOS.forEach(c => {
      const a = document.createElement("article"); a.className = "panel combo";
      const label = c.n ? `Combo ${c.n}` : "Honorable mention";
      a.innerHTML = `${c.sticker ? `<span class="sticker ${c.stickerCls || ""}">${c.sticker}</span>` : ""}
        <p class="kicker">${label}</p><h3>${comboName(c.b)}</h3><p class="note">${c.note}</p>${legend(c.b)}
        <div class="stair-wrap"><div class="stair"></div></div>
        <div class="row"><button class="btn" type="button" data-k="listen">Listen</button><button class="btn" type="button" data-k="slow">Slow ×4</button><button class="btn pri" type="button" data-k="echo">Echo ×4</button></div>`;
      const tg = a.querySelector(".stair");
      a.querySelectorAll("[data-k]").forEach(b => b.onclick = () => run(comboPlan(c.b, b.dataset.k, tg, label)));
      a.dataset.blocks = c.b.join(","); list.appendChild(a);
    });
  }
  function drawCombos() { const sh = keyShift(); document.querySelectorAll("#comboList .combo").forEach(a => renderStair(a.querySelector(".stair"), comboNotes(a.dataset.blocks.split(","), sh), sh)); }

  let chain = [];
  function buildBuilder() {
    const c = $("#buildChips");
    ORDER.forEach(k => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = "+ " + BLOCKS[k].name;
      b.style.setProperty("--c", BLOCKS[k].c); b.style.background = BLOCKS[k].c; b.style.color = BLOCKS[k].on;
      b.onclick = () => { if (chain.length < 6) { chain.push(k); drawBuilder(); } }; c.appendChild(b);
    });
    $("#bUndo").onclick = () => { chain.pop(); drawBuilder(); };
    $("#bClear").onclick = () => { chain = []; drawBuilder(); };
    $("#bListen").onclick = () => chain.length && run(comboPlan(chain, "listen", $("#buildStair"), "Your chain"));
    $("#bEcho").onclick = () => chain.length && run(comboPlan(chain, "echo", $("#buildStair"), "Your chain"));
  }
  function drawBuilder() {
    const sh = keyShift(); renderStair($("#buildStair"), comboNotes(chain, sh), sh);
    $("#buildEmpty").hidden = chain.length > 0; $("#buildStair").parentElement.hidden = !chain.length;
    ["#bListen", "#bEcho", "#bUndo", "#bClear"].forEach(s => $(s).disabled = !chain.length);
  }

  /* ---------- log ---------- */
  function renderLog() {
    const log = VL.log.all(), ol = $("#logList"); ol.innerHTML = ""; $("#logEmpty").hidden = log.length > 0;
    log.slice(0, 60).forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="rate-chip ${VL.esc(e.r)}"></span><strong></strong><span></span>`;
      li.children[0].textContent = e.r; li.children[1].textContent = e.what; li.children[2].textContent = `${e.key}, ${e.tempo} · ${e.when}`; ol.appendChild(li);
    });
  }
  let armed = false;
  function bindClear() {
    $("#clearLog").onclick = e => {
      const b = e.currentTarget;
      if (!armed) { armed = true; b.textContent = "Tap again to clear"; setTimeout(() => { armed = false; b.textContent = "Clear log"; }, 3000); return; }
      armed = false; b.textContent = "Clear log"; VL.log.clear();
    };
  }

  /* ---------- key walk ---------- */
  const CHORDS = { minor: [[0, 7, 10, 15, 17], "minor 11"], blues: [[0, 7, 10, 15, 17], "minor 11"], major: [[0, 7, 11, 14, 16], "major 9"], majpent: [[0, 7, 9, 14, 16], "6/9"] };
  function chordFor(shift) {
    let bass = S().tonic + shift - 24; while (bass < 33) bass += 12;
    const [iv, suf] = CHORDS[st.set];
    return { notes: iv.map(x => bass + x), name: (flats(shift) ? FLAT : SHARP)[tonicPc(shift)] + " " + suf };
  }
  function walkItemNotes(shift) { const [kind, id] = st.wItem.split(":"); return kind === "r" ? notesFor(id, shift) : comboNotes(COMBOS[+id].b, shift); }
  function walkItemName() { const [kind, id] = st.wItem.split(":"); if (kind === "r") return BLOCKS[id].name; const c = COMBOS[+id]; return (c.n ? `Combo ${c.n}` : "Honorable mention") + ": " + comboName(c.b); }
  function walkShifts() {
    const ns = walkItemNotes(0), lo = Math.min(...ns.map(n => n.midi)), hi = top(ns);
    const s0 = st.wLow - lo, s1 = Math.min(st.wHigh - hi, s0 + 24);
    return { s0, s1, lo, hi, ok: s1 >= s0 };
  }
  function buildWalk() {
    VL.select($("#wItem"), [
      { group: "The five riffs", items: ORDER.map(k => ({ value: "r:" + k, label: BLOCKS[k].name })) },
      { group: "Combos", items: COMBOS.map((c, i) => ({ value: "c:" + i, label: (c.n ? `Combo ${c.n}: ` : "Honorable mention: ") + comboName(c.b) })) }
    ], st.wItem);
    ["#wLow", "#wHigh"].forEach(id => VL.select($(id), Array.from({ length: 49 }, (_, i) => ({ value: 36 + i, label: VL.pitchName(36 + i) }))));
    $("#wLow").value = st.wLow; $("#wHigh").value = st.wHigh; $("#wReps").value = st.wReps; $("#wMode").value = st.wMode;
    $("#wStart").onclick = startWalk;
    [["#wItem", "wItem"], ["#wLow", "wLow", 1], ["#wHigh", "wHigh", 1], ["#wReps", "wReps", 1], ["#wMode", "wMode"]].forEach(([id, key, num]) =>
      $(id).addEventListener("change", e => { st[key] = num ? +e.target.value : e.target.value; if (VL.audio.isRunning()) VL.audio.stop(true); VL.changed(); }));
  }
  function drawWalk() {
    const w = walkShifts(), sum = $("#wSummary"), keys = $("#wKeys"), btn = $("#wStart");
    keys.innerHTML = "";
    if (!w.ok) {
      renderStair($("#wStair"), walkItemNotes(0), 0);
      sum.className = "hint warn";
      sum.textContent = `This one spans ${w.hi - w.lo} half steps, so it needs at least that much room between your lowest and highest notes. Widen the range to start.`;
      btn.disabled = true; return;
    }
    btn.disabled = false; sum.className = "hint";
    renderStair($("#wStair"), walkItemNotes(w.s0), w.s0);
    for (let s = w.s0; s <= w.s1; s++) {
      const c = document.createElement("span"); c.className = "kchip"; c.style.marginBottom = `${(s - w.s0) * 5}px`;
      c.textContent = (flats(s) ? FLAT : SHARP)[tonicPc(s)]; c.dataset.s = s; keys.appendChild(c);
    }
    const up = w.s1 - w.s0 + 1, nKeys = up * 2 - 1;
    const len = walkItemNotes(0).reduce((a, n) => a + n.beats, 0), barB = Math.max(4, Math.ceil(len / 4 - 1e-6) * 4);
    const beats = nKeys * (4 + st.wReps * barB * (st.wMode === "echo" ? 2 : 1)) + 4;
    const mins = Math.max(1, Math.round(beats * 60 / st.tempo / 60));
    sum.textContent = `${up} key${up > 1 ? "s" : ""} up, from ${chordFor(w.s0).name} to ${chordFor(w.s1).name}, then back down. That's ${nKeys} keys in about ${mins} minute${mins > 1 ? "s" : ""} at ${st.tempo} bpm.`;
  }
  function markKey(s, dir) {
    document.querySelectorAll("#wKeys .kchip").forEach(c => { const v = +c.dataset.s; c.classList.toggle("on", v === s); c.classList.toggle("done", dir === "up" ? v < s : v > s); });
  }
  function startWalk() {
    const w = walkShifts(); if (!w.ok) return;
    const path = []; for (let s = w.s0; s <= w.s1; s++) path.push([s, "up"]); for (let s = w.s1 - 1; s >= w.s0; s--) path.push([s, "down"]);
    const tgt = $("#wStair"), reps = [];
    path.forEach(([s, dir], ki) => {
      const ch = chordFor(s), ns = walkItemNotes(s), tonic = S().tonic + s, where = `key ${ki + 1} of ${path.length}, going ${dir}`;
      reps.push({ notes: [], tempo: st.tempo, echo: false, chord: ch.notes, pad: ch.notes.slice(1), tonic, label: `${ch.name} · ${where}`, onStart: () => { renderStair(tgt, ns, s); markKey(s, dir); } });
      for (let j = 0; j < st.wReps; j++) {
        const r = rep(ns, st.tempo, { target: tgt, tonic, syll: "“ah”", label: `${ch.name} · ${j + 1} of ${st.wReps} · ${where}` });
        r.echo = st.wMode === "echo"; r.pad = ch.notes.slice(1); reps.push(r);
      }
    });
    run({ title: `Key walk: ${walkItemName()}`, reps, noCount: true, bumpable: true, after: () => drawWalk(),
      keyText: `${VL.pitchName(st.wLow)} to ${VL.pitchName(st.wHigh)}`, tempoText: `${st.tempo} bpm`, meta: { item: "walk:" + st.wItem, bpm: st.tempo } });
  }

  /* ---------- hint + refresh ---------- */
  function drawHint() {
    const sh = keyShift(), hs = top(notesFor("skip", sh)), need = st.cap - hs;
    const el = $("#targetHint");
    if (need < 0) { el.textContent = `In ${keyLabel(sh)}, the Skip Quick Dip Trip already starts above ${capName()}. Pick a lower key or a higher top note.`; return; }
    if (need === 0) { el.textContent = `In ${keyLabel(sh)}, the Skip Quick Dip Trip starts right on ${capName()}, your top note today.`; return; }
    el.textContent = `Your top note today is ${capName()}. The Skip Quick Dip Trip starts on it in ${keyLabel(sh + need)}, ${need} half step${need > 1 ? "s" : ""} above your key, which is where its key walk tops out.`;
  }
  function refresh() { const sh = keyShift(); ORDER.forEach(k => drawRiff(k, sh)); drawShapes(); drawCombos(); drawBuilder(); drawHint(); drawWalk(); }

  VL.blocks = {
    init() {
      buildWalk(); buildRiffs(); buildShapeChips(); buildCombos(); buildBuilder(); bindClear();
      $("#shapeAll").onclick = runAllShapes;
      $$sub();
      renderLog(); refresh();
      VL.onSettings(refresh); VL.onLog(renderLog);
    },
    runLadder: (k, step) => run(ladderPlan(k, step)),
    runShapes: k => { shape = k; buildShapeChips(); drawShapes(); runAllShapes(); },
    notesFor: k => notesFor(k, keyShift()),
    keyLabel: () => keyLabel(keyShift()),
    spell: m => pn(m, keyShift()),
    tonicMidi: () => S().tonic + keyShift()
  };
  function $$sub() {
    document.querySelectorAll("#ch-blocks .subnav [data-go]").forEach(b => b.onclick = () => { const el = document.getElementById(b.dataset.go); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
})();
