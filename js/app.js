/* Vocal Licks: wiring for the shared Setup drawer and startup. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory;

  function buildSetup() {
    VL.select($("#key"), T.KEYNAMES.map((k, i) => ({ value: i, label: k })));
    VL.select($("#low"), Array.from({ length: 25 }, (_, i) => ({ value: 40 + i, label: VL.pitchName(40 + i) })));
    VL.select($("#cap"), Array.from({ length: 16 }, (_, i) => ({ value: 64 + i, label: VL.pitchName(64 + i) })));
    [["#set", "set"], ["#key", "key", 1], ["#tempo", "tempo", 1], ["#cap", "cap", 1], ["#low", "low", 1], ["#oct", "oct", 1], ["#mode", "mode"], ["#sound", "sound"], ["#spacing", "spacing"]].forEach(([id, key, num]) => {
      $(id).addEventListener(id === "#tempo" ? "input" : "change", e => {
        st[key] = num ? +e.target.value : e.target.value;
        if (id === "#tempo") $("#tempoOut").textContent = st.tempo;
        if (key === "low" && st.low > st.cap - 12) { st.cap = Math.min(79, st.low + 12); $("#cap").value = st.cap; }
        if (key === "cap" && st.cap < st.low + 12) { st.low = Math.max(40, st.cap - 12); $("#low").value = st.low; }
        if (VL.audio.isRunning() && id !== "#tempo") VL.audio.stop(true);
        VL.changed();
      });
    });
    const toggle = () => VL.openSetup($("#setupPanel").hidden);
    $("#setupToggle").onclick = toggle;
    $("#setupSummary").onclick = toggle;
    $("#setupDone").onclick = () => { VL.openSetup(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  }
  /* one Setup drawer holds every setting; `where` scrolls to a group inside it */
  VL.openSetup = function (open, where) {
    const p = $("#setupPanel");
    p.hidden = !open; $("#setupToggle").setAttribute("aria-expanded", open);
    if (open) (where ? $(where) : p).scrollIntoView({ behavior: "smooth", block: "start" });
  };
  VL.syncSetup = function () {
    $("#set").value = st.set; $("#key").value = st.key; $("#tempo").value = st.tempo; $("#tempoOut").textContent = st.tempo;
    $("#cap").value = st.cap; $("#low").value = st.low; $("#oct").value = st.oct; $("#mode").value = st.mode; $("#sound").value = st.sound; $("#spacing").value = st.spacing;
    drawSummary();
  };
  function drawSummary() {
    const set = VL.data.SETS[st.set];
    const riffs = [`${T.KEYNAMES[st.key]} ${set.name}`, `${st.tempo} bpm`, `${VL.pitchName(st.low)}–${VL.pitchName(st.cap)}`,
      st.sound === "piano" ? "Grand piano" : "Simple synth", st.mode === "echo" ? "Echo" : "Sing along", st.spacing === "roomy" ? "Roomy" : "Tight"];
    const p = VL.data.PROGRESSIONS.find(x => x.id === st.cProg) || VL.data.PROGRESSIONS[0];
    const band = [`${p.name} in ${T.KEYNAMES[st.cKey]}`, T.STYLES[st.cStyle].name];
    // on Changes the band leads; elsewhere your riff settings do
    const list = st.chapter === "changes" ? band.concat(riffs.slice(1, 3)) : riffs;
    $("#setupSummary").innerHTML = list.map(x => `<span>${VL.esc(x)}</span>`).join("") + `<span class="edit">Edit setup</span>`;
  }
  VL.drawSummary = drawSummary;

  document.addEventListener("DOMContentLoaded", () => {
    buildSetup(); VL.syncSetup();
    VL.bar.init();
    VL.audio.loadPiano();
    VL.blocks.init();
    VL.changes.init();
    VL.vocab.init();
    VL.session.init();
    VL.guide.init();
    VL.onSettings(() => { drawSummary(); VL.audio.soundStatus(); });
    VL.audio.soundStatus();
    VL.initRouter();
    VL.titleSelects();
    document.addEventListener("change", e => { if (e.target.tagName === "SELECT") VL.titleSelects(); });
  });
})();
