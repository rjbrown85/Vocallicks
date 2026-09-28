/* Vocal Licks core: helpers, settings, log, now-playing bar, router. */
(function () {
  const VL = window.VL = window.VL || {};
  const T = VL.theory;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  VL.$ = $; VL.$$ = $$;
  VL.pitchName = m => T.SHARP[T.mod(m)] + (Math.floor(m / 12) - 1);
  VL.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- settings ---------- */
  const DEF = {
    set: "minor", key: 4, tempo: 70, cap: 72, low: 52, oct: 0, mode: "echo", sound: "piano", spacing: "tight",
    wItem: "r:qd", wLow: 57, wHigh: 72, wReps: 4, wMode: "along",
    cProg: "axis", cKey: 7, cStyle: "rnb", cBars: 1, cLoops: 4, cMode: "listen", cApproach: "key", cFlavor: "sweet", cRiff: "qd", cPlace: "every", cSource: "auto",
    vItem: "v:cas3", vMethod: "doo", sLen: 15, chapter: "blocks"
  };
  const st = VL.st = Object.assign({}, DEF);
  try {
    const saved = JSON.parse(localStorage.getItem("vocallicks-settings")) || JSON.parse(localStorage.getItem("riff-blocks-settings")) || {};
    Object.keys(DEF).forEach(k => { if (saved[k] !== undefined) st[k] = saved[k]; });
  } catch (e) {}
  VL.save = () => { try { localStorage.setItem("vocallicks-settings", JSON.stringify(st)); } catch (e) {} };
  const subs = [];
  VL.onSettings = fn => subs.push(fn);
  VL.changed = () => { VL.save(); subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };

  /* ---------- log (shared by every chapter) ---------- */
  const LOGKEY = "riff-blocks-log";
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOGKEY)) || []; } catch (e) { log = []; }
  VL.log = {
    all: () => log,
    add(plan, r) {
      const m = plan.meta || {};
      log.unshift({ when: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        what: plan.title, key: plan.keyText || "", tempo: plan.tempoText || "", r, ts: Date.now(), day: VL.today(),
        chapter: m.chapter || "", item: m.item || "", step: m.step || "", bpm: m.bpm || null });
      log = log.slice(0, 400);
      try { localStorage.setItem(LOGKEY, JSON.stringify(log)); } catch (e) {}
      logSubs.forEach(f => f());
    },
    clear() { log = []; try { localStorage.setItem(LOGKEY, "[]"); } catch (e) {} logSubs.forEach(f => f()); }
  };
  const logSubs = [];
  VL.onLog = fn => logSubs.push(fn);
  VL.today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

  /* ---------- now-playing bar ---------- */
  const bar = () => $("#bar");
  /* plan.next = {label, go}: the button that starts the next step without waiting */
  function showNext() {
    const p = VL.audio.lastPlan, nx = p && p.next;
    ["#bNext", "#bNext2"].forEach(id => { const b = $(id); b.hidden = !nx; if (nx) b.textContent = "Next: " + nx.label; });
  }
  function goNext() {
    const p = VL.audio.lastPlan; if (!p || !p.next) return;
    VL.bar.mode("off"); p.next.go();
  }
  VL.bar = {
    status(main, detail, turn) { $("#bState").textContent = main; $("#bDetail").textContent = detail || ""; bar().classList.toggle("turn", !!turn); },
    mode(m) { $("#bRun").hidden = m !== "run"; $("#bRate").hidden = m !== "rate"; $("#bBump").hidden = m !== "bump"; bar().hidden = m === "off"; if (m === "rate" || m === "bump") showNext(); },
    init() {
      $("#bStop").onclick = () => VL.audio.stop(true);
      $("#bSkip").onclick = () => VL.bar.mode("off");
      $("#bDone").onclick = () => VL.bar.mode("off");
      $$("#bRate [data-r]").forEach(btn => btn.onclick = () => {
        const r = btn.dataset.r, p = VL.audio.lastPlan;
        if (p) VL.log.add(p, r);
        if (r === "Clean" && st.tempo < 100 && p && p.bumpable) {
          const nt = Math.min(120, st.tempo + 5);
          $("#bumpBtn").textContent = `Set tempo to ${nt}`; $("#bumpBtn").dataset.t = nt;
          $("#bumpBtn").hidden = false;
          VL.bar.status("Logged. Clean.", "Ready for a little more speed?"); VL.bar.mode("bump");
        } else if (p && p.next) {
          $("#bumpBtn").hidden = true;
          VL.bar.status(`Logged. ${r}.`, r === "Clean" ? "On to the next one." : "Run it again, or move on."); VL.bar.mode("bump");
        } else VL.bar.mode("off");
      });
      $("#bNext").onclick = () => goNext();
      $("#bNext2").onclick = () => goNext();
      $("#bumpBtn").onclick = e => { st.tempo = +e.currentTarget.dataset.t; VL.syncSetup(); VL.changed(); VL.bar.mode("off"); };
    }
  };

  /* ---------- router ---------- */
  const CHAPTERS = ["blocks", "changes", "vocab", "session", "guide"];
  VL.go = function (ch, push) {
    if (!CHAPTERS.includes(ch)) ch = "blocks";
    CHAPTERS.forEach(c => { const el = $("#ch-" + c); if (el) el.hidden = c !== ch; });
    $$(".chapnav [data-ch]").forEach(b => b.setAttribute("aria-current", b.dataset.ch === ch ? "page" : "false"));
    document.body.dataset.chapter = ch;
    st.chapter = ch; VL.save();
    if (push !== false) { try { history.replaceState(null, "", "#" + ch); } catch (e) { location.hash = ch; } }
    window.scrollTo({ top: 0 });
    (VL.onShow[ch] || []).forEach(f => f());
  };
  VL.onShow = {};
  VL.whenShown = (ch, fn) => (VL.onShow[ch] = VL.onShow[ch] || []).push(fn);
  VL.initRouter = function () {
    $$(".chapnav [data-ch]").forEach(b => b.onclick = () => VL.go(b.dataset.ch));
    const h = (location.hash || "").slice(1);
    VL.go(CHAPTERS.includes(h) ? h : st.chapter, false);
    window.addEventListener("hashchange", () => { const x = location.hash.slice(1); if (CHAPTERS.includes(x)) VL.go(x, false); });
  };

  /* ---------- small UI helpers ---------- */
  /* staircase: notes [{midi, beats, color, on, acc, label, alt}] */
  VL.renderStair = function (el, notes, spell) {
    el.innerHTML = "";
    if (!notes.length) { el.style.height = "0px"; return; }
    const lo = Math.min(...notes.map(n => n.midi)), hi = Math.max(...notes.map(n => n.midi)), acc = notes.some(n => n.acc);
    el.style.height = `calc(var(--step) * ${hi - lo} + ${acc ? 82 : 52}px)`;
    notes.forEach(n => {
      const col = document.createElement("div"); col.className = "col"; col.style.width = `calc(var(--beat) * ${n.beats})`;
      const b = document.createElement("div"); b.className = "brick" + (n.acc ? " acc" : "") + (n.alt ? " alt" : "");
      b.style.setProperty("--c", n.color); b.style.setProperty("--on", n.on || "var(--ink)");
      b.style.bottom = `calc(var(--step) * ${n.midi - lo} + 4px)`;
      b.textContent = spell ? spell(n.midi) : T.SHARP[T.mod(n.midi)];
      b.title = VL.pitchName(n.midi);
      col.appendChild(b); el.appendChild(col);
    });
  };
  VL.clearHits = () => $$(".brick.hit").forEach(b => b.classList.remove("hit"));
  VL.hit = (el, i, on) => { const b = el && el.querySelectorAll(".brick")[i]; if (b) b.classList.toggle("hit", on); };

  VL.select = function (sel, options, value) {
    sel.innerHTML = "";
    options.forEach(o => {
      if (o.group) {
        const g = document.createElement("optgroup"); g.label = o.group;
        o.items.forEach(it => { const op = document.createElement("option"); op.value = it.value; op.textContent = it.label; g.appendChild(op); });
        sel.appendChild(g);
      } else { const op = document.createElement("option"); op.value = o.value; op.textContent = o.label; sel.appendChild(op); }
    });
    if (value !== undefined) sel.value = value;
  };
})();
