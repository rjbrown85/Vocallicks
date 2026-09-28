/* Chapter 04: Session. Daily routine, streak, progress, and recording yourself over a loop. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory, D = VL.data;

  const EASY_TO_HARD = ["aeolian", "axis", "otheraxis", "doowop", "mixo", "popnew", "i454", "ib7", "royal", "twofive", "backdoor", "minor4", "epic", "i5b74", "b6b7", "extplagal", "creep", "jttou", "andalusian", "blues12"];
  const VOCAB_ORDER = ["climb", "turn", "cas3", "trip3", "encl", "cas4", "gospel", "blue", "arpm7", "arpmaj7"];
  const dayIndex = () => Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 864e5);
  const progName = id => (D.PROGRESSIONS.find(p => p.id === id) || {}).name || id;

  function nextLadderStep(k) {
    let best = 0;
    VL.log.all().forEach(e => { if (e.item === "block:" + k && e.r === "Clean" && e.step) best = Math.max(best, +e.step); });
    return Math.min(5, best + 1);
  }
  const STEP_NAMES = ["", "Listen", "Detached", "Smooth", "Speed up", "Key walk"];

  function routine() {
    const d = dayIndex();
    const riff = D.ORDER[((d % 5) + 5) % 5], step = nextLadderStep(riff);
    const prog = EASY_TO_HARD[((d % EASY_TO_HARD.length) + EASY_TO_HARD.length) % EASY_TO_HARD.length];
    const voc = VOCAB_ORDER[((d % VOCAB_ORDER.length) + VOCAB_ORDER.length) % VOCAB_ORDER.length];
    const shape = ["qd", "sl", "sw", "qdt"][((d % 4) + 4) % 4];
    const steps = [
      { id: "warm", mins: 2, title: "Warm up light", text: "Pentatonic climb on “doo,” quiet.", go: () => VL.vocab.run("v:climb", "doo") },
      { id: "block", mins: 3, title: `${D.BLOCKS[riff].name}: ${STEP_NAMES[step]}`, text: `Ladder step ${step} of 5.`, go: () => { VL.go("blocks"); setTimeout(() => { document.getElementById("riff-" + riff).scrollIntoView({ block: "start" }); VL.blocks.runLadder(riff, step); }, 60); } },
      { id: "changes", mins: 4, title: `${progName(prog)}: one scale, sing along`, text: "Follow the piano's riffs.", go: () => VL.changes.runPreset({ cProg: prog, cApproach: "key", cMode: "along", cPlace: "phrase", cLoops: 4 }) }
    ];
    if (st.sLen >= 15) {
      steps.push({ id: "arr", mins: 3, title: `Arrange: ${progName(prog)}`, text: "Lock two or three riffs into the loop, then sing along.", go: () => VL.changes.openArranger(prog) });
      steps.splice(2, 0, { id: "shape", mins: 2, title: `Move the ${D.BLOCKS[shape].name}`, text: "The same shape from every scale step.", go: () => { VL.go("blocks"); setTimeout(() => { document.getElementById("shapes").scrollIntoView({ block: "start" }); VL.blocks.runShapes(shape); }, 60); } });
      steps.push({ id: "vocab", mins: 3, title: `New lick: ${VL.vocab.itemName("v:" + voc)}`, text: "Build it from the last notes backward.", go: () => VL.vocab.run("v:" + voc, "back") });
    }
    if (st.sLen >= 20) {
      steps.push({ id: "cbc", mins: 3, title: `${progName(prog)}: chord by chord, echo`, text: "The scale follows each chord. Echo each landing.", go: () => VL.changes.runPreset({ cProg: prog, cApproach: "chord", cMode: "echo", cPlace: "phrase", cLoops: 4 }) });
      steps.push({ id: "rec", mins: 2, title: "Record one take", text: "Free-riff over the loop, listen back once.", go: () => { VL.go("session"); setTimeout(() => $("#recorder").scrollIntoView({ block: "start" }), 60); } });
    }
    return steps;
  }
  const doneKey = () => "vl-routine-" + VL.today();
  function getDone() { try { return JSON.parse(localStorage.getItem(doneKey())) || {}; } catch (e) { return {}; } }
  function setDone(o) { try { localStorage.setItem(doneKey(), JSON.stringify(o)); localStorage.setItem("vl-days-" + VL.today(), "1"); } catch (e) {} }

  const NO_RUN = ["arr", "rec"];
  /* Start a routine step. The run it starts gets a Next button that ticks this step and starts the next one. */
  function startStep(steps, i) {
    const s = steps[i], nx = steps[i + 1];
    VL.pendingNext = !NO_RUN.includes(s.id) && nx ? { label: nx.title, go: () => { const o = getDone(); o[s.id] = true; setDone(o); drawRoutine(); drawStreak(); startStep(steps, i + 1); } } : null;
    s.go();
  }
  function drawRoutine() {
    const steps = routine(), done = getDone(), ol = $("#sSteps");
    ol.innerHTML = "";
    const total = steps.reduce((a, s) => a + s.mins, 0);
    $("#sTotal").textContent = `About ${total} minutes today.`;
    steps.forEach((s, i) => {
      const li = document.createElement("li"); li.className = "rstep" + (done[s.id] ? " done" : "");
      li.innerHTML = `<span class="rnum">${i + 1}</span><div class="rbody"><b>${VL.esc(s.title)}</b><span>${VL.esc(s.text)} About ${s.mins} min.</span></div>
        <div class="row"><button class="btn pri" type="button">Start</button><label class="chk"><input type="checkbox" ${done[s.id] ? "checked" : ""}> Done</label></div>`;
      li.querySelector("button").onclick = () => startStep(steps, i);
      li.querySelector("input").onchange = e => { const o = getDone(); o[s.id] = e.target.checked; setDone(o); drawRoutine(); drawStreak(); };
      ol.appendChild(li);
    });
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
      $("#sLen").value = st.sLen;
      $("#sLen").onchange = e => { st.sLen = +e.target.value; VL.changed(); };
      $("#rStart").onclick = startRecording;
      $("#sArrNew").onclick = () => VL.changes.openArranger(st.cProg);
      drawRoutine(); drawStreak(); drawProgress(); recSummary(); drawTakes(); drawArrangements();
      VL.onSettings(() => { drawRoutine(); recSummary(); drawArrangements(); });
      VL.onLog(() => { drawRoutine(); drawStreak(); drawProgress(); });
      VL.whenShown("session", () => { drawRoutine(); drawStreak(); drawProgress(); recSummary(); drawArrangements(); });
    }
  };
})();
