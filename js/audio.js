/* Vocal Licks audio: grand piano (Tone.js + Salamander), synth fallback, timeline scheduler. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$;
  const HAS_TONE = typeof window.Tone !== "undefined";
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let ctx = null, master = null, runGain = null, runSampler = null, timers = [], pumpTimer = null, running = null;
  let buffers = null, pianoReady = false, pianoFailed = !HAS_TONE;
  const URLS = {};
  for (let m = 33; m <= 84; m += 3) { const nm = VL.theory.SHARP[m % 12] + (Math.floor(m / 12) - 1); URLS[nm] = nm.replace("#", "s") + ".mp3"; }

  const A = VL.audio = { lastPlan: null, hooks: { start: [], end: [] } };

  A.soundStatus = function () {
    const el = $("#soundStatus"); if (!el) return;
    if (st.sound === "synth") { el.textContent = "Using the simple synth."; return; }
    el.textContent = pianoReady ? "Grand piano loaded." : pianoFailed ? "The grand piano didn't load, so the simple synth will play instead. Reloading the page usually fixes it." : "Loading the grand piano…";
  };
  A.loadPiano = function () {
    if (!HAS_TONE) { A.soundStatus(); return; }
    try {
      buffers = new Tone.ToneAudioBuffers({ urls: URLS, baseUrl: "piano/", onload: () => { pianoReady = true; A.soundStatus(); }, onerror: () => { pianoFailed = true; A.soundStatus(); } });
    } catch (e) { pianoFailed = true; A.soundStatus(); }
  };
  A.ctx = function () {
    if (!ctx) {
      ctx = HAS_TONE ? Tone.getContext().rawContext : new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
      A.master = master;
    }
    if (HAS_TONE) Tone.start().catch(() => {}); else if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  function makeSampler(out) {
    if (st.sound !== "piano" || !pianoReady) return null;
    try {
      const urls = {}; Object.keys(URLS).forEach(k => { urls[k] = buffers.get(k); });
      const s = new Tone.Sampler({ urls, release: .7 }); s.volume.value = -3; s.connect(out); return s;
    } catch (e) { return null; }
  }
  function pluck(m, t, dur, vel, out) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = "triangle"; o2.type = "sine"; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2; g2.gain.value = .28;
    const pk = .3 * vel, dec = Math.min(dur, .22);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + .012);
    g.gain.exponentialRampToValueAtTime(pk * .5, t + Math.max(.02, dec)); g.gain.setValueAtTime(pk * .5, t + Math.max(.021, dur));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur + .16);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
    o.start(t); o2.start(t); o.stop(t + dur + .22); o2.stop(t + dur + .22);
  }
  function play(m, t, dur, vel, out) {
    if (runSampler) runSampler.triggerAttackRelease(Tone.Frequency(m, "midi").toNote(), Math.max(.05, dur), t, Math.max(.05, Math.min(1, vel)));
    else pluck(m, t, dur, vel, out);
  }
  function click(t, strong, soft, out) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = strong ? 1650 : 1150;
    const pk = soft ? (strong ? .03 : .018) : (strong ? .08 : .05);
    g.gain.setValueAtTime(pk, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); o.connect(g); g.connect(out); o.start(t); o.stop(t + .04);
  }
  function drone(t0, t1, notes, out) {
    const lvl = notes.length > 2 ? .028 : .05;
    notes.forEach(m => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = hz(m);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(lvl, t0 + .25); g.gain.setValueAtTime(lvl, Math.max(t0 + .26, t1 - .3));
      g.gain.exponentialRampToValueAtTime(.0001, t1); o.connect(g); g.connect(out); o.start(t0); o.stop(t1 + .05);
    });
  }

  /* ---------- timeline ---------- */
  A.timeline = function () {
    const ev = [];
    return {
      ev,
      note(t, m, d, v) { ev.push({ t, k: "n", m, d, v }); },
      notes(t, ms, d, v, strum) { ms.forEach((m, i) => ev.push({ t: t + i * (strum || 0), k: "n", m, d, v })); },
      click(t, strong, soft) { ev.push({ t, k: "c", strong, soft }); },
      pad(t, d, ms, v) { ev.push({ t, k: "p", d, ms, v: v || .22 }); },
      ui(t, fn) { ev.push({ t, k: "u", fn }); },
      end: 0
    };
  };

  A.run = function (plan) {
    A.stop(false); A.ctx();
    runGain = ctx.createGain(); runGain.connect(master);
    runSampler = makeSampler(runGain);
    const g = runGain, t0 = ctx.currentTime + .2;
    const evs = plan.tl.ev.slice().sort((a, b) => a.t - b.t);
    running = plan; VL.bar.mode("run");
    const at = (time, fn) => timers.push(setTimeout(fn, Math.max(0, (time - ctx.currentTime) * 1000)));
    let i = 0;
    const pump = () => {
      const horizon = ctx.currentTime + 2.5;
      while (i < evs.length && t0 + evs[i].t < horizon) {
        const e = evs[i++], t = t0 + e.t;
        if (e.k === "n") play(e.m, t, e.d, e.v, g);
        else if (e.k === "c") click(t, e.strong, e.soft, g);
        else if (e.k === "p") { if (runSampler) e.ms.forEach((m, j) => play(m, t + j * .02, e.d * .95, e.v, g)); else drone(t, t + e.d, e.ms, g); }
        else if (e.k === "u") at(t, e.fn);
      }
    };
    pump(); pumpTimer = setInterval(pump, 200);
    at(t0 + plan.tl.end + .05, finish);
    A.hooks.start.forEach(f => f(plan));
  };
  function finish() {
    clearInterval(pumpTimer); pumpTimer = null; timers = []; VL.clearHits();
    const p = running; running = null;
    if (p && p.after) p.after();
    if (runGain) { const g = runGain, s = runSampler; setTimeout(() => { g.disconnect(); if (s) s.dispose(); }, 2500); runGain = null; runSampler = null; }
    A.lastPlan = p;
    A.hooks.end.forEach(f => f(p, true));
    if (p && p.noRate) { VL.bar.mode("off"); return; }
    VL.bar.status("How did that go?", p ? p.title : "", false); VL.bar.mode("rate");
  }
  A.stop = function (user) {
    clearInterval(pumpTimer); pumpTimer = null; timers.forEach(clearTimeout); timers = []; VL.clearHits();
    if (runGain && ctx) { const g = runGain, s = runSampler; g.gain.setTargetAtTime(0, ctx.currentTime, .02); setTimeout(() => { g.disconnect(); if (s) s.dispose(); }, 300); runGain = null; runSampler = null; }
    const p = running;
    if (p && p.after) p.after();
    running = null;
    if (p) A.hooks.end.forEach(f => f(p, false));
    if (user) VL.bar.mode("off");
  };
  A.isRunning = () => !!running;

  /* ---------- rep-based runs (used by Blocks and Vocabulary) ----------
     rep: {notes:[{midi,beats,vel}], tempo, echo, solo, staccato, target, tonic, pad, chord, label, syll, onStart} */
  A.runReps = function (plan) {
    const tl = A.timeline();
    let t = 0;
    const b0 = 60 / plan.reps[0].tempo;
    for (let i = 0; i < 4; i++) { tl.click(t + i * b0, i === 0, false); const k = i; tl.ui(t + i * b0, () => VL.bar.status("Count-in", `${k + 1} of 4 · ${plan.title}`)); }
    t += 4 * b0;
    plan.reps.forEach((rep, ri) => {
      const b = 60 / rep.tempo, len = rep.notes.reduce((s, n) => s + n.beats, 0), barB = Math.max(4, Math.ceil(len / 4 - 1e-6) * 4);
      const total = barB * (rep.echo ? 2 : 1);
      const pad = rep.pad || [rep.tonic - 12, rep.tonic - 5];
      const pianoPad = st.sound === "piano";
      if (!rep.chord) { tl.pad(t, (pianoPad ? barB : total) * b, pad, .22); if (rep.echo && pianoPad) tl.pad(t + barB * b, barB * b, pad, .2); }
      else if (!pianoPad) tl.pad(t, total * b, pad, .2);
      for (let k = 0; k < total; k++) tl.click(t + k * b, k % 4 === 0, true);
      const roundTxt = plan.noCount ? rep.label : `Round ${ri + 1} of ${plan.reps.length} · ${rep.label}`;
      if (rep.chord) { tl.notes(t, rep.chord, total * b * .95, .55, .03); tl.ui(t, () => { if (rep.onStart) rep.onStart(); VL.bar.status("New key", roundTxt); }); t += total * b; return; }
      tl.ui(t, () => { if (rep.onStart) rep.onStart(); VL.bar.status(rep.echo || rep.solo ? "Listen" : "Sing along", roundTxt); });
      let nt = t;
      rep.notes.forEach((n, i) => {
        const d = n.beats * b;
        tl.note(nt, n.midi, rep.staccato ? Math.min(d * .5, .15) : d * .92, n.vel);
        if (rep.target) { const el = rep.target, ii = i + (rep.hitOffset || 0); tl.ui(nt, () => VL.hit(el, ii, true)); tl.ui(nt + d * .85, () => VL.hit(el, ii, false)); }
        nt += d;
      });
      if (rep.echo) tl.ui(t + barB * b, () => VL.bar.status("Your turn", rep.syll ? `Sing it back on ${rep.syll} · ${roundTxt}` : `Sing it back · ${roundTxt}`, true));
      t += total * b;
    });
    tl.end = t;
    plan.tl = tl;
    A.run(plan);
  };
})();
