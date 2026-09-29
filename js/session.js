/* Chapter 03: Session. One guided daily session built on one progression:
   Part 1 checks all five blocks, Part 2 puts them over the changes, Part 3 adds scale runs and a lick.
   Also: per-riff mastery, streak, progress, saved arrangements, and the recorder. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;

  const EASY_TO_HARD = ["aeolian", "axis", "sunshine", "grapevine", "whatsgoingon", "otheraxis", "runhill", "doowop", "heyjude", "brown", "louie", "sweethome", "sleepwalk", "doowopii", "heavensdoor", "purple", "mixo", "fourfive", "popnew", "i454", "bluesrock", "ib7", "coldplay", "onetwo", "fourthree", "royal", "wonderwall", "twofive", "circle", "eightdays", "backdoor", "minor4", "epic", "i5b74", "b6b7", "extplagal", "wheremind", "twist", "california", "dock", "hmaxis", "risingsun", "lovely", "hotelcal", "quickchange", "creep", "electric", "jttou", "andalusian", "pachelbel", "blues12"];
  const LICKS = ["turn", "climb", "flip", "cas3", "seq3", "trip3", "encl", "cas4"];   // licks that can land over changes
  const RANK = { Clean: 3, Almost: 2, Messy: 1 };
  const dayIndex = () => Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 864e5);
  const pickDaily = list => list[((dayIndex() % list.length) + list.length) % list.length];
  const progName = id => (D.PROGRESSIONS.find(p => p.id === id) || {}).name || id;
  const bname = k => D.BLOCKS[k].name;

  /* ---------- per-riff mastery: level 1-4 from the log, tempo that climbs after three Clean checks ---------- */
  const MKEY = "vl-mastery";
  let mastery = {};
  try { mastery = JSON.parse(localStorage.getItem(MKEY)) || {}; } catch (e) {}
  const saveM = () => { try { localStorage.setItem(MKEY, JSON.stringify(mastery)); } catch (e) {} };
  function m(k) { return (mastery[k] = mastery[k] || { tempo: Math.max(40, Math.min(100, st.tempo)), streak: 0 }); }
  const LEVELS = ["At home, slow", "At home, 100 bpm", "From any note", "Over the changes"];
  function levels(k) {
    const log = VL.log.all(), clean = e => e.r === "Clean";
    return [true,
      log.some(e => clean(e) && e.item === "block:" + k && (e.bpm || 0) >= 100),
      log.some(e => clean(e) && e.item === "shape:" + k),
      log.some(e => clean(e) && (e.item === "chg:" + k || e.item === "chg:rotate"))];
  }
  function rateBlock(k, r) {
    const x = m(k);
    if (r === "Clean") { x.streak++; if (x.streak >= 3) { x.tempo = Math.min(120, x.tempo + 5); x.streak = 0; x.bumped = VL.today(); } }
    else x.streak = 0;
    saveM(); drawMastery();
  }

  /* ---------- today's state ---------- */
  const SKEY = () => "vl-session-" + VL.today();
  let day = { i: 0, done: [], ratings: {} };
  try { day = Object.assign(day, JSON.parse(localStorage.getItem(SKEY())) || {}); } catch (e) {}
  const saveDay = () => { try { localStorage.setItem(SKEY(), JSON.stringify(day)); localStorage.setItem("vl-days-" + VL.today(), "1"); } catch (e) {} };

  /* the progression's own minor-pentatonic key note, so Part 1 drills the exact notes Part 2 uses */
  function ctx() {
    const C = VL.changes.compute();
    return { C, riffKey: C.keyHome.minorRoot, fl: C.fl };
  }
  const weakest = () => {
    let w = null;
    D.ORDER.forEach(k => { const r = day.ratings[k]; if (!r || r === "Clean") return; if (!w || RANK[r] < RANK[day.ratings[w]]) w = k; });
    return w;
  };

  /* ---------- building each kind of step ---------- */
  function blockPlan(k, kind) {
    const { riffKey } = ctx(), { notes, tonic } = VL.blocks.inKey(k, riffKey), x = m(k);
    const stair = $("#sStair");
    VL.renderStair(stair, notes.map(n => ({ midi: n.midi, beats: n.beats, color: D.BLOCKS[k].c, on: D.BLOCKS[k].on, acc: n.acc })), mm => T.spell(mm, ctx().fl));
    const slow = Math.max(40, Math.round(x.tempo * .6));
    const rep = (tempo, o) => Object.assign({ notes, tempo, echo: true, tonic, target: stair, syll: "“ah”", label: `${tempo} bpm` }, o || {});
    const reps = kind === "fix"
      ? [rep(slow, { staccato: true, syll: "“hee”", label: `detached, ${slow} bpm` }), rep(slow, { staccato: true, syll: "“hee”", label: `detached, ${slow} bpm` }),
         rep(slow, { label: `smooth, ${slow} bpm` }), rep(slow, { label: `smooth, ${slow} bpm` })]
      : [rep(x.tempo), rep(x.tempo)];
    return { title: `${bname(k)}${kind === "fix" ? ": slow fix" : ": check"}`, reps, keyText: T.SHARP[riffKey] + " minor pentatonic", tempoText: `${reps[0].tempo} bpm`,
      meta: { chapter: "session", item: "block:" + k, step: kind, bpm: reps[0].tempo }, onRate: r => { if (kind === "check") { day.ratings[k] = r; saveDay(); rateBlock(k, r); } } };
  }
  /* which riff lands on each chord change, pass by pass */
  function part2Rids(C, passes) {
    const n = C.n, out = [];
    const one = st.sFormat === "weak" ? (weakest() || st.sOne) : st.sOne;
    for (let p = 0; p < passes; p++) out.push(Array.from({ length: n }, (_, i) => st.sFormat === "rotate" ? D.ORDER[(p * n + i) % 5] : one));
    return out;
  }
  function modeKinds(n) {
    // the default ladder: listen, then sing along with a quiet piano, then echo (piano pass, your pass)
    if (st.sMode === "ladder") return n >= 5 ? ["riff", "along", "along", "echo", "echo"].concat(Array(n - 5).fill("echo")) : n === 4 ? ["riff", "along", "echo", "echo"] : ["riff", "along", "echo"].slice(0, n);
    return Array(n).fill({ listen: "riff", along: "along", echo: "echo", solo: "solo" }[st.sMode]);
  }
  const labelHint = labels => i => { const l = labels.find(x => x.i === i); return l ? (l.miss ? `${l.name} doesn't fit here` : `${l.name} → ${l.land} on ${l.chord}`) : ""; };
  function expand(C, perPass) {   // perPass: [{notes, labels, kind}] -> passes with echo split into two loops
    const out = [];
    perPass.forEach(pp => {
      if (pp.kind === "echo") { out.push({ notes: pp.notes, kind: "riff", hint: labelHint(pp.labels) }); out.push({ notes: [], kind: "yours", hint: labelHint(pp.labels) }); }
      else if (pp.kind === "solo") out.push({ notes: [], kind: "loop", hint: labelHint(pp.labels) });
      else out.push({ notes: pp.notes, kind: pp.kind, hint: labelHint(pp.labels) });
    });
    return out;
  }
  function part2Plan(solo) {
    const { C } = ctx(), S = VL.changes.session;
    const nPass = st.sFormat === "rotate" ? Math.max(3, Math.ceil(5 * (st.sLen >= 15 ? 1 : .6))) : (st.sLen >= 15 ? 5 : 4);
    const rids = part2Rids(C, nPass);
    const kinds = solo ? Array(rids.length).fill("solo") : modeKinds(rids.length);
    const passes = expand(C, rids.map((r, p) => Object.assign(S.landingPass(C, r), { kind: kinds[p] })));
    const what = st.sFormat === "rotate" ? "all five, rotating" : bname(rids[0][0]);
    const plan = S.passesPlan(C, passes, { title: solo ? `${C.prog.name}: from memory` : `${C.prog.name}: ${what}`, label: solo ? "From memory" : "Blocks over the changes",
      meta: { item: st.sFormat === "rotate" ? "chg:rotate" : "chg:" + rids[0][0], step: solo ? "solo" : st.sMode } });
    return plan;
  }
  function scaleWalkPlan() {
    const { C } = ctx(), S = VL.changes.session, walk = S.scaleWalkPass(C);
    const hint = i => { const l = walk.labels.find(x => x.i === i); return l ? l.mode : ""; };
    const kinds = st.sLen >= 15 ? ["riff", "along", "echo", "echo"] : ["riff", "along", "echo"];
    const passes = [];
    kinds.forEach(k => { if (k === "echo") { passes.push({ notes: walk.notes, kind: "riff", hint }); passes.push({ notes: [], kind: "yours", hint }); } else passes.push({ notes: walk.notes, kind: k, hint }); });
    return S.passesPlan(C, passes, { title: `Scale walk: ${C.prog.name}`, label: "Scale walk", meta: { item: "walk:" + C.prog.id, step: "scales" } });
  }
  const lickId = () => pickDaily(LICKS);
  function lickBuildPlan() { const { riffKey } = ctx(); return VL.vocab.planIn("v:" + lickId(), "back", $("#sStair"), riffKey); }
  function lickChangesPlan() {
    const { C } = ctx(), S = VL.changes.session, id = lickId(), row = Array(C.n).fill(id);
    const kinds = st.sLen >= 15 ? ["along", "along", "echo"] : ["along", "echo"];
    return S.passesPlan(C, expand(C, kinds.map(k => Object.assign(S.landingPass(C, row), { kind: k }))), { title: `${S.riffName(id)} over ${C.prog.name}`, label: "Lick over the changes", meta: { item: "chg:" + id, step: "lick" } });
  }
  function freePlan() {
    const { C } = ctx(), S = VL.changes.session;
    const hint = i => { const next = C.chords[(i + 1) % C.n], t = C.infos[(i + 1) % C.n].targets[0]; return `land on ${T.spellRel(next.root, T.spell(next.root, C.fl), t.pc)} of ${T.chordName(next, C.fl)}`; };
    return S.passesPlan(C, [0, 1].map(() => ({ notes: [], kind: "loop", hint })), { title: `Free riff: ${C.prog.name}`, label: "Free riff", meta: { item: "prog:" + C.prog.id, step: "free" } });
  }

  /* ---------- the step list ---------- */
  function steps() {
    const { C } = ctx(), lick = VL.changes.session.riffName(lickId());
    const fmt = { rotate: "all five rotating through the chords", one: `${bname(st.sOne)} on every chord`, weak: "your weakest riff on every chord" }[st.sFormat];
    const list = D.ORDER.map(k => ({ id: "b-" + k, part: 1, title: `${bname(k)}`, text: `Two echo rounds at ${m(k).tempo} bpm, in ${C.keyHome ? T.SHARP[C.keyHome.minorRoot] : ""} minor pentatonic. Rate it and the next one starts.`, plan: () => blockPlan(k, "check") }));
    list.push({ id: "fix", part: 1, title: "Fix the weakest", text: "Slow detached and smooth rounds on the riff you rated lowest. Skipped if all five were Clean.", plan: () => { const w = weakest(); return w ? blockPlan(w, "fix") : null; } });
    list.push({ id: "p2", part: 2, title: `Over ${C.prog.name}`, text: `Blocks over the changes: ${fmt}. ${st.sMode === "ladder" ? "Listen, sing along with a quiet piano, then echo." : ""}`, plan: () => part2Plan(false) });
    if (st.sLen >= 15) list.push({ id: "p2solo", part: 2, title: "From memory", text: "The loop alone. The bar shows which riff lands where; sing the placements yourself.", plan: () => part2Plan(true) });
    list.push({ id: "walk", part: 3, title: "Scale walk", text: "1-2-3-4-5-4-3-2 on each chord's own scale, so you hear the scale change under you.", plan: scaleWalkPlan });
    list.push({ id: "lick", part: 3, title: `Lick: ${lick}`, text: "Build it from the last notes backward.", plan: lickBuildPlan });
    list.push({ id: "lickc", part: 3, title: `${lick} over the changes`, text: "The lick lands on every chord change: sing along, then echo.", plan: lickChangesPlan });
    if (st.sLen >= 15) list.push({ id: "free", part: 3, title: "Free riff", text: "Two loops with no piano riffs. Use anything from today.", plan: freePlan });
    if (st.sLen >= 20) list.push({ id: "rec", part: 3, title: "Record a take", text: "Record yourself over the loop and listen back once.", plan: null, record: true });
    return list;
  }
  const PART = { 1: "Part 1 · Five-block check", 2: "Part 2 · Blocks over the changes", 3: "Part 3 · Runs and licks" };

  /* ---------- the player ---------- */
  let list = [];
  function runStep(i) {
    list = steps();
    if (i >= list.length) { day.i = list.length; saveDay(); drawPlayer(); return; }
    day.i = i; saveDay();
    const s = list[i];
    if (s.record) { drawPlayer(); VL.reveal($("#recorder"), true); return; }
    const plan = s.plan();
    if (!plan) { markDone(s.id); return runStep(i + 1); }          // e.g. nothing to fix today
    const nx = list[i + 1];
    plan.next = { label: nx ? nx.title : "Finish", go: () => { markDone(s.id); runStep(i + 1); } };
    plan.autoNext = $("#sAuto").checked;
    const onRate = plan.onRate;
    plan.onRate = r => { if (onRate) onRate(r); if (!plan.autoNext) markDone(s.id); };
    drawPlayer();
    if (plan.reps) VL.audio.runReps(plan); else VL.audio.run(plan);
  }
  /* real running time: plan lengths at today's tempos, plus a few seconds per rating */
  let estKey = "", estMin = 0;
  function estimate(list) {
    const key = JSON.stringify([st.cProg, st.cKey, st.cStyle, st.cBars, st.sFormat, st.sOne, st.sMode, st.sLen, st.tempo, st.spacing, mastery]);
    if (key === estKey) return estMin;
    let sec = 0;
    const repsSec = reps => reps.reduce((a, r) => a + VL.audio.roundBeats(r.notes.reduce((x, n) => x + n.beats, 0)) * (r.echo ? 2 : 1) * 60 / r.tempo, 0) + VL.audio.countBeats() * 60 / reps[0].tempo;
    list.forEach(s => {
      if (s.record) { sec += 90; return; }
      if (s.part === 1) {
        const k = s.id === "fix" ? null : s.id.slice(2);
        const len = k ? D.SETS.minor.blocks[k].b.reduce((a, x) => a + x, 0) : 3, t = k ? m(k).tempo : 60;
        sec += (VL.audio.countBeats() + (k ? 2 : 4) * VL.audio.roundBeats(len) * 2) * 60 / t + 4; return;
      }
      try { const p = s.plan(); sec += (p.reps ? repsSec(p.reps) : p.tl.end) + 5; } catch (e) {}
    });
    estKey = key; estMin = Math.max(1, Math.round(sec / 60));
    return estMin;
  }
  function markDone(id) { if (!day.done.includes(id)) day.done.push(id); saveDay(); drawPlayer(); drawStreak(); }
  function drawPlayer() {
    list = steps();
    const strip = $("#sStrip"); strip.innerHTML = "";
    list.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = `p${s.part}` + (day.done.includes(s.id) ? " done" : "") + (i === day.i ? " now" : "");
      const r = s.id.startsWith("b-") ? day.ratings[s.id.slice(2)] : null;
      li.innerHTML = `<button type="button" title="${VL.esc(s.title)}"><small>${i + 1}</small><span class="stitle">${VL.esc(s.title)}</span>${r ? `<i class="rate-chip ${r}">${r}</i>` : ""}</button>`;
      li.querySelector("button").onclick = () => { VL.audio.stop(true); day.i = i; saveDay(); drawPlayer(); };
      strip.appendChild(li);
    });
    const finished = day.i >= list.length, s = list[Math.min(day.i, list.length - 1)];
    $("#sPart").textContent = finished ? "Done for today" : PART[s.part];
    $("#sTitle").textContent = finished ? "Session complete" : s.title;
    $("#sDetail").textContent = finished ? "Nice work. Everything is logged, and tomorrow's session is ready when you are." : s.text;
    $("#sGo").textContent = finished ? "Run it again" : day.i === 0 && !day.done.length ? "Start session" : `Start: ${s.title}`;
    $("#sStairWrap").hidden = !(s && s.part === 1) || finished;
    if (s && s.part === 1 && !finished && !VL.audio.isRunning()) {
      const k = s.id === "fix" ? weakest() : s.id.slice(2);
      if (k) { const { riffKey, fl } = ctx(), { notes } = VL.blocks.inKey(k, riffKey); VL.renderStair($("#sStair"), notes.map(n => ({ midi: n.midi, beats: n.beats, color: D.BLOCKS[k].c, on: D.BLOCKS[k].on, acc: n.acc })), mm => T.spell(mm, fl)); }
    }
    if (!VL.audio.isRunning()) $("#sTotal").textContent = `${list.length} steps, about ${estimate(list)} minutes at today's tempos, all in ${progName(st.cProg)} (${T.KEYNAMES[st.cKey]}).`;
  }
  function drawMastery() {
    const tb = $("#sMast"); if (!tb) return; tb.innerHTML = "";
    D.ORDER.forEach(k => {
      const lv = levels(k), x = m(k), tr = document.createElement("tr");
      tr.innerHTML = `<td><i class="mdot" style="--c:${D.BLOCKS[k].c}"></i>${VL.esc(bname(k))}</td>
        <td class="lvls">${lv.map((on, i) => `<span class="lv${on ? " on" : ""}" title="${LEVELS[i]}">${i + 1}</span>`).join("")}</td>
        <td>${x.tempo} bpm</td><td class="streak">${[0, 1, 2].map(i => `<span class="sd${i < x.streak ? " on" : ""}"></span>`).join("")}</td>`;
      tb.appendChild(tr);
    });
  }
  function buildControls() {
    const fill = (sel, src) => { $(sel).innerHTML = $(src).innerHTML; };
    fill("#sProgSel", "#cProg"); fill("#sKeySel", "#cKey"); fill("#sStyleSel", "#cStyle");
    VL.select($("#sOne"), D.ORDER.map(k => ({ value: k, label: bname(k) })), st.sOne);
    const bind = (sel, key, num) => $(sel).addEventListener("change", e => { st[key] = num ? +e.target.value : e.target.value; if (VL.audio.isRunning()) VL.audio.stop(true); VL.changed(); });
    bind("#sProgSel", "cProg"); bind("#sKeySel", "cKey", 1); bind("#sStyleSel", "cStyle"); bind("#sFormat", "sFormat"); bind("#sOne", "sOne"); bind("#sMode", "sMode"); bind("#sLen", "sLen", 1);
    $("#sSuggestUse").onclick = () => { st.cProg = pickDaily(EASY_TO_HARD); VL.changed(); };
    $("#sGo").onclick = () => { if (day.i >= list.length) { day = { i: 0, done: [], ratings: {} }; saveDay(); } runStep(day.i); };
    $("#sAgain").onclick = () => runStep(Math.max(0, Math.min(day.i, list.length - 1)));
    $("#sSkip").onclick = () => { VL.audio.stop(true); if (day.i < list.length) markDone(list[day.i].id); day.i = Math.min(list.length, day.i + 1); saveDay(); drawPlayer(); };
    let armed = false;
    $("#sReset").onclick = e => {
      const b = e.currentTarget;
      if (!armed) { armed = true; b.textContent = "Tap again to restart"; setTimeout(() => { armed = false; b.textContent = "Start over"; }, 3000); return; }
      armed = false; b.textContent = "Start over"; VL.audio.stop(true); day = { i: 0, done: [], ratings: {} }; saveDay(); drawPlayer();
    };
  }
  function syncControls() {
    if ($("#sProgSel").options.length !== $("#cProg").options.length) $("#sProgSel").innerHTML = $("#cProg").innerHTML;
    $("#sProgSel").value = st.cProg; $("#sKeySel").value = st.cKey; $("#sStyleSel").value = st.cStyle;
    $("#sFormat").value = st.sFormat; $("#sOne").value = st.sOne; $("#sMode").value = st.sMode; $("#sLen").value = st.sLen;
    $("#sOneWrap").hidden = st.sFormat !== "one";
    const sug = pickDaily(EASY_TO_HARD);
    $("#sSuggest").hidden = sug === st.cProg;
    $("#sSuggestName").textContent = progName(sug);
  }

  function practicedDays() {
    const days = new Set(VL.log.all().map(e => e.day).filter(Boolean));
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("vl-days-")) days.add(k.slice(8)); } } catch (e) {}
    return days;
  }
  function dayStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function drawStreak() {
    const days = practicedDays(), strip = $("#sCal"); strip.innerHTML = "";
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dayStr(d), on = days.has(k);
      const c = document.createElement("span"); c.className = "day" + (on ? " on" : "") + (i === 0 ? " today" : "");
      c.innerHTML = `<b>${d.toLocaleDateString([], { weekday: "short" }).slice(0, 2)}</b><span>${d.getDate()}</span>`;
      c.title = k + (on ? ": practiced" : "");
      strip.appendChild(c);
    }
    let streak = 0; const d = new Date(today);
    if (!days.has(dayStr(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayStr(d))) { streak++; d.setDate(d.getDate() - 1); }
    $("#sStreak").textContent = streak === 0 ? "No streak yet. Today is a good day to start one." : `${streak} day${streak > 1 ? "s" : ""} in a row.`;
  }

  function itemLabel(item) {
    const [kind, id] = item.split(":");
    if (kind === "block") return D.BLOCKS[id] ? D.BLOCKS[id].name : id;
    if (kind === "shape") return "Move the " + (D.BLOCKS[id] ? D.BLOCKS[id].name : id);
    if (kind === "combo") return "Combo: " + id.split("+").map(x => D.BLOCKS[x] ? D.BLOCKS[x].name : x).join(" + ");
    if (kind === "walk") return "Key walk";
    if (kind === "prog") return "Changes: " + progName(id);
    if (kind === "b" || kind === "v") return VL.vocab.itemName(item);
    return item;
  }
  function drawProgress() {
    const rows = {};
    VL.log.all().forEach(e => {
      if (!e.item) return;
      const r = rows[e.item] = rows[e.item] || { item: e.item, runs: 0, clean: 0, best: 0, last: e.day };
      r.runs++; if (e.r === "Clean") { r.clean++; if (e.bpm) r.best = Math.max(r.best, e.bpm); }
      if (e.day > r.last) r.last = e.day;
    });
    const list = Object.values(rows).sort((a, b) => (b.last || "").localeCompare(a.last || "") || b.runs - a.runs).slice(0, 20);
    const tb = $("#sProg"); tb.innerHTML = "";
    $("#sProgEmpty").hidden = list.length > 0;
    $("#sProgWrap").hidden = !list.length;
    list.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td></td><td>${r.runs}</td><td>${r.clean}</td><td>${r.best ? r.best + " bpm" : "–"}</td><td>${r.last || ""}</td>`;
      tr.children[0].textContent = itemLabel(r.item);
      tb.appendChild(tr);
    });
  }

  /* ---------- recorder ---------- */
  const takes = [];
  let recording = null;
  function recSummary() {
    const p = D.PROGRESSIONS.find(x => x.id === st.cProg);
    $("#rWhat").textContent = `${p ? p.name : ""} in ${T.KEYNAMES[st.cKey]}, ${T.STYLES[st.cStyle].name}, ${st.cLoops} loops at ${st.tempo} bpm${st.cSource === "mine" ? ", your arrangement" : ""}.`;
  }
  const inPreview = () => { try { return window.top !== window.self && !/github\.io$/.test(location.hostname); } catch (e) { return true; } };
  async function startRecording() {
    const msg = $("#rMsg"); msg.textContent = "";
    if (recording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      msg.textContent = inPreview() ? "The claude.ai preview can't record. Open the GitHub Pages version to record." : "This browser doesn't support recording. Try a current Chrome, Edge, Firefox, or Safari."; return;
    }
    const ctx = VL.audio.ctx();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
    catch (e) { msg.textContent = inPreview() ? "The claude.ai preview blocks the microphone. Open the GitHub Pages version to record." : "The microphone was blocked. Allow it for this site (the icon in the address bar), then try again."; return; }
    const dest = ctx.createMediaStreamDestination();
    const mic = ctx.createMediaStreamSource(stream); mic.connect(dest);
    VL.audio.master.connect(dest);
    const chunks = [];
    const rec = new MediaRecorder(dest.stream);
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      try { mic.disconnect(); VL.audio.master.disconnect(dest); } catch (e) {}
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      const p = D.PROGRESSIONS.find(x => x.id === st.cProg);
      takes.unshift({ url: URL.createObjectURL(blob), label: `${p ? p.name : "Take"}, ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`, ext: (rec.mimeType || "").includes("mp4") ? "m4a" : "webm" });
      recording = null; drawTakes(); $("#rStart").disabled = false;
    };
    rec.start();
    recording = rec; $("#rStart").disabled = true;
    const once = () => { VL.audio.hooks.end.splice(VL.audio.hooks.end.indexOf(once), 1); setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, 1200); };
    VL.audio.hooks.end.push(once);
    VL.audio.run(VL.changes.buildPlan({ mode: $("#rGuide").value }));
  }
  function drawTakes() {
    const ol = $("#rTakes"); ol.innerHTML = "";
    $("#rEmpty").hidden = takes.length > 0;
    takes.forEach((t, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<b></b><audio controls preload="metadata"></audio><a class="btn" download>Save</a>`;
      li.children[0].textContent = t.label; li.children[1].src = t.url;
      li.children[2].href = t.url; li.children[2].download = `vocal-licks-take-${takes.length - i}.${t.ext}`;
      ol.appendChild(li);
    });
  }

  /* ---------- saved arrangements ---------- */
  function drawArrangements() {
    const list = VL.changes.saved(), ol = $("#sArr"); ol.innerHTML = "";
    $("#sArrEmpty").hidden = list.length > 0;
    list.forEach(a => {
      const li = document.createElement("li");
      li.innerHTML = `<b></b><span class="meta"></span><span class="row"><button class="btn" type="button" data-m="listen">Listen</button><button class="btn pri" type="button" data-m="along">Sing along</button><button class="btn" type="button" data-m="edit">Edit</button></span>`;
      li.children[0].textContent = a.name;
      li.children[1].textContent = `${a.items.length} riff${a.items.length === 1 ? "" : "s"} · ${progName(a.prog)}`;
      li.querySelectorAll("[data-m]").forEach(b => b.onclick = () => b.dataset.m === "edit" ? VL.changes.editSaved(a.id) : VL.changes.playSaved(a.id, b.dataset.m));
      ol.appendChild(li);
    });
  }

  VL.session = {
    init() {
      buildControls(); syncControls();
      $("#rStart").onclick = startRecording;
      $("#sArrNew").onclick = () => VL.changes.openArranger(st.cProg);
      drawPlayer(); drawMastery(); drawStreak(); drawProgress(); recSummary(); drawTakes(); drawArrangements();
      VL.onSettings(() => { syncControls(); if (!VL.audio.isRunning()) drawPlayer(); recSummary(); drawArrangements(); });
      VL.onLog(() => { drawMastery(); drawStreak(); drawProgress(); });
      VL.whenShown("session", () => { syncControls(); drawPlayer(); drawMastery(); drawStreak(); drawProgress(); recSummary(); drawArrangements(); });
    },
    start: () => { VL.go("session"); runStep(day.i >= list.length ? 0 : day.i); }
  };
})();
