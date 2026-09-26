/* Vocal Licks: wiring for the shared Setup drawer and startup. */
(function () {
  const VL = window.VL, st = VL.st, $ = VL.$, T = VL.theory;

  function buildSetup() {
    VL.select($("#key"), T.KEYNAMES.map((k, i) => ({ value: i, label: k })));
    VL.select($("#low"), Array.from({ length: 25 }, (_, i) => ({ value: 40 + i, label: VL.pitchName(40 + i) })));
    VL.select($("#cap"), Array.from({ length: 16 }, (_, i) => ({ value: 64 + i, label: VL.pitchName(64 + i) })));
    [["#set", "set"], ["#key", "key", 1], ["#tempo", "tempo", 1], ["#cap", "cap", 1], ["#low", "low", 1], ["#oct", "oct", 1], ["#mode", "mode"], ["#sound", "sound"]].forEach(([id, key, num]) => {
      $(id).addEventListener(id === "#tempo" ? "input" : "change", e => {
        st[key] = num ? +e.target.value : e.target.value;
        if (id === "#tempo") $("#tempoOut").textContent = st.tempo;
        if (key === "low" && st.low > st.cap - 12) { st.cap = Math.min(79, st.low + 12); $("#cap").value = st.cap; }
        if (key === "cap" && st.cap < st.low + 12) { st.low = Math.max(40, st.cap - 12); $("#low").value = st.low; }
        if (VL.audio.isRunning() && id !== "#tempo") VL.audio.stop(true);
        VL.changed();
      });
    });
    const toggle = () => {
      const p = $("#setupPanel"), open = p.hidden;
      p.hidden = !open; $("#setupToggle").setAttribute("aria-expanded", open);
      if (open) p.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $("#setupToggle").onclick = toggle;
    $("#setupSummary").onclick = toggle;
  }
  VL.syncSetup = function () {
    $("#set").value = st.set; $("#key").value = st.key; $("#tempo").value = st.tempo; $("#tempoOut").textContent = st.tempo;
    $("#cap").value = st.cap; $("#low").value = st.low; $("#oct").value = st.oct; $("#mode").value = st.mode; $("#sound").value = st.sound;
    drawSummary();
  };
  function drawSummary() {
    const set = VL.data.SETS[st.set];
    $("#setupSummary").innerHTML = [
      `${T.KEYNAMES[st.key]} ${set.name}`, `${st.tempo} bpm`, `${VL.pitchName(st.low)}–${VL.pitchName(st.cap)}`,
      st.sound === "piano" ? "Grand piano" : "Simple synth", st.mode === "echo" ? "Echo" : "Sing along"
    ].map(x => `<span>${VL.esc(x)}</span>`).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildSetup(); VL.syncSetup();
    VL.bar.init();
    VL.audio.loadPiano();
    VL.blocks.init();
    VL.changes.init();
    VL.vocab.init();
    VL.session.init();
    VL.onSettings(() => { drawSummary(); VL.audio.soundStatus(); });
    VL.audio.soundStatus();
    VL.initRouter();
  });
})();
