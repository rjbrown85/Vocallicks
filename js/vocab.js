/* Chapter 03: Vocabulary. New riff patterns plus a workbench of practice methods. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;
  const mod = T.mod;

  /* realize a vocab pattern in the Setup key (the same key the Blocks drills use) */
  function range() { return { lo: st.low, hi: st.cap, center: st.low + (st.cap - st.low) * .55 }; }
  function tonicPc() { return mod(st.key); }
  function vocabNotes(v) {
    const { lo, hi, center } = range();
    const key = tonicPc();
    const vel = (j, n) => j === 0 ? .9 : j === n - 1 ? .75 : .8;
    if (v.kind === "pent") {
      const pcs = T.MINPENT.map(i => mod(key + i));
      const lad = T.ladder(pcs, lo - 24, hi + 24);
      let best = null;
      lad.forEach((m, j) => {
        if (mod(m) !== key) return;
        const idx = v.steps.map(s => j + s);
        if (idx.some(i => i < 0 || i >= lad.length)) return;
        const ns = idx.map(i => lad[i]);
        const out = ns.filter(x => x < lo || x > hi).length;
        const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
        const score = out * 100 + Math.abs(mean - center);
        if (!best || score < best.score) best = { score, ns };
      });
      return best.ns.map((m, j) => ({ midi: m, beats: v.beats[j], vel: vel(j, best.ns.length) }));
    }
    if (v.kind === "encl") {
      const third = mod(key + 3);
      let t = lo; while (mod(t) !== third || t < center - 4) t++;
      const ns = [t + 2, t - 1, t];
      return ns.map((m, j) => ({ midi: m, beats: v.beats[j], vel: vel(j, 3) }));
    }
    // semitone patterns: ctx major uses the relative major of the Setup key so it shares the pentatonic
    const root = v.ctx === "major" ? mod(key + 3) : key;
    let best = null;
    for (let r = lo - 12; r <= hi; r++) {
      if (mod(r) !== root) continue;
      const ns = v.semis.map(s => r + s);
      const out = ns.filter(x => x < lo || x > hi).length;
      const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
      const score = out * 100 + Math.abs(mean - center);
      if (!best || score < best.score) best = { score, ns };
    }
    return best.ns.map((m, j) => ({ midi: m, beats: v.beats[j], vel: vel(j, best.ns.length) }));
  }
  function itemById(id) {
    const [kind, k] = id.split(":");
    if (kind === "b") { const B = D.BLOCKS[k]; return { id, name: B.name, c: B.c, on: B.on, notes: VL.blocks.notesFor(k).map(n => ({ midi: n.midi, beats: n.beats, vel: n.vel, acc: n.acc })) }; }
    const v = D.VOCAB.find(x => x.id === k) || D.VOCAB[0];
    return { id, name: v.name, c: v.c, on: "var(--ink)", notes: vocabNotes(v), v };
  }
  const spell = m => VL.blocks.spell(m);

  /* ---------- methods ---------- */
  function rhythmVariant(notes, kind) {
    const n = notes.length;
    return notes.map((x, j) => {
      let b = x.beats;
      if (kind === "straight") b = j === n - 1 ? Math.max(.5, x.beats) : .25;
      if (kind === "triplet") b = j === n - 1 ? Math.max(.5, x.beats) : 1 / 3;
      if (kind === "swung") b = j === n - 1 ? Math.max(.5, x.beats) : (j % 2 === 0 ? 1 / 3 : 1 / 6);
      return Object.assign({}, x, { beats: b });
    });
  }
  const NEXT = { listen: "doo", doo: "back", chunk: "back", back: "speed", accent: "speed", rhythm: "speed" };
  function methodPlan(item, method, target) {
    const Tm = st.tempo, slow = Math.max(40, Math.round(Tm * .6)), notes = item.notes, n = notes.length;
    const tonic = VL.blocks.tonicMidi();
    const echo = st.mode === "echo";
    const rep = (ns, tempo, o = {}) => ({ notes: ns, tempo, echo: o.solo ? false : echo, solo: !!o.solo, target: o.target === undefined ? target : o.target, hitOffset: o.off || 0,
      tonic, label: o.label || "", syll: o.syll });
    let reps = [], title = `${item.name}: ${D.METHODS.find(m => m.id === method).name.toLowerCase()}`;
    if (method === "listen") reps = [rep(notes, Tm, { solo: true, label: `${Tm} bpm` }), rep(notes, Tm, { solo: true, label: `${Tm} bpm` })];
    if (method === "doo") {
      for (let i = 0; i < 3; i++) reps.push(rep(notes, slow, { syll: "“doo”", label: `on “doo,” ${slow} bpm` }));
      reps.push(rep(notes, slow, { syll: "“ah”", label: `now on “ah,” ${slow} bpm` }));
    }
    if (method === "chunk") {
      const h = Math.ceil(n / 2), a = notes.slice(0, h), b = notes.slice(h);
      reps.push(rep(a, slow, { label: "first half", off: 0 }), rep(a, slow, { label: "first half", off: 0 }));
      reps.push(rep(b, slow, { label: "second half", off: h }), rep(b, slow, { label: "second half", off: h }));
      reps.push(rep(notes, slow, { label: "whole riff" }), rep(notes, slow, { label: "whole riff" }));
    }
    if (method === "back") {
      const step = n > 7 ? 2 : 1;
      for (let k = Math.min(2, n); k <= n; k += step) reps.push(rep(notes.slice(n - k), slow, { label: `last ${k} notes`, off: n - k }));
      if ((n - Math.min(2, n)) % step) reps.push(rep(notes, slow, { label: "whole riff" }));
    }
    if (method === "accent") {
      const rounds = Math.min(n, 6);
      for (let k = 0; k < rounds; k++) reps.push(rep(notes.map((x, j) => Object.assign({}, x, { vel: j === k ? 1 : .5 })), slow, { label: `lean on note ${k + 1}` }));
    }
    if (method === "rhythm") {
      [["as written", notes], ["straight sixteenths", rhythmVariant(notes, "straight")], ["triplets", rhythmVariant(notes, "triplet")], ["swung", rhythmVariant(notes, "swung")]]
        .forEach(([lab, ns]) => reps.push(rep(ns, slow, { label: lab })));
    }
    if (method === "speed") {
      const goal = Math.max(Tm, 100);
      for (let i = 0; i < 4; i++) { const tt = Math.round(Tm + (goal - Tm) * i / 3); reps.push(rep(notes, tt, { label: `${tt} bpm`, syll: "“ah”" })); }
    }
    const tempos = [...new Set(reps.map(r => r.tempo))];
    const nx = NEXT[method], nm = nx && D.METHODS.find(m => m.id === nx);
    const next = nm ? { label: nm.name, go: () => { if (target === $("#vStair")) { st.vMethod = nx; VL.changed(); } VL.audio.runReps(methodPlan(item, nx, target)); } } : null;
    return { title, reps, next, bumpable: method !== "listen", keyText: VL.blocks.keyLabel(), tempoText: tempos.length > 1 ? `${tempos[0]} to ${tempos[tempos.length - 1]} bpm` : `${tempos[0]} bpm`,
      meta: { chapter: "vocab", item: item.id, step: method, bpm: tempos[tempos.length - 1] } };
  }
  function stairNotes(item) { return item.notes.map(n => ({ midi: n.midi, beats: n.beats, color: item.c, on: item.on, acc: n.acc })); }

  /* ---------- drawing ---------- */
  function buildCards() {
    const list = $("#vList"); list.innerHTML = "";
    D.VOCAB.forEach((v, i) => {
      const a = document.createElement("article"); a.className = "panel vcard"; a.id = "v-" + v.id; a.style.setProperty("--c", v.c);
      a.innerHTML = `${v.land ? '<span class="sticker">works in Changes</span>' : ""}
        <div class="riff-head"><span class="num" aria-hidden="true">${String.fromCharCode(65 + i)}</span><h3>${VL.esc(v.name)}</h3></div>
        <div class="stair-wrap"><div class="stair"></div></div>
        <div class="row"><button class="btn" type="button" data-m="listen">Listen</button><button class="btn" type="button" data-m="doo">Doo first</button><button class="btn" type="button" data-m="back">Build from the end</button><button class="btn pri" type="button" data-m="bench">Open in workbench</button></div>`;
      a.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
        const it = itemById("v:" + v.id);
        if (b.dataset.m === "bench") { st.vItem = "v:" + v.id; VL.changed(); $("#bench").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
        VL.audio.runReps(methodPlan(it, b.dataset.m, a.querySelector(".stair")));
      });
      list.appendChild(a);
    });
  }
  function drawCards() {
    D.VOCAB.forEach(v => { const a = $("#v-" + v.id); VL.renderStair(a.querySelector(".stair"), stairNotes(itemById("v:" + v.id)), spell); });
  }
  function buildBench() {
    VL.select($("#vItem"), [
      { group: "Her five blocks", items: D.ORDER.map(k => ({ value: "b:" + k, label: D.BLOCKS[k].name })) },
      { group: "Vocabulary", items: D.VOCAB.map(v => ({ value: "v:" + v.id, label: v.name })) }
    ], st.vItem);
    VL.select($("#vMethod"), D.METHODS.map(m => ({ value: m.id, label: m.name })), st.vMethod);
    [["#vItem", "vItem"], ["#vMethod", "vMethod"]].forEach(([id, key]) => $(id).addEventListener("change", e => { st[key] = e.target.value; VL.changed(); }));
    $("#vGo").onclick = () => VL.audio.runReps(methodPlan(itemById(st.vItem), st.vMethod, $("#vStair")));
  }
  function drawBench() {
    $("#vItem").value = st.vItem; $("#vMethod").value = st.vMethod;
    const it = itemById(st.vItem);
    VL.renderStair($("#vStair"), stairNotes(it), spell);
    $("#vMethodNote").textContent = D.METHODS.find(m => m.id === st.vMethod).desc;
  }
  function draw() { drawCards(); drawBench(); }

  VL.vocab = {
    init() { buildCards(); buildBench(); draw(); VL.onSettings(draw); },
    run(id, method) { VL.go("vocab"); st.vItem = id; st.vMethod = method; VL.changed(); setTimeout(() => VL.audio.runReps(methodPlan(itemById(id), method, $("#vStair"))), 50); },
    itemName: id => { try { return itemById(id).name; } catch (e) { return id; } }
  };
})();
