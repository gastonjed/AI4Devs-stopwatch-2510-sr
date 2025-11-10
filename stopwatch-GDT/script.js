
(() => {
  // --- Elements
  const el = {
    hh: document.getElementById("hh"),
    mm: document.getElementById("mm"),
    ss: document.getElementById("ss"),
    ms: document.getElementById("ms"),
    toggle: document.getElementById("toggleBtn"),
    clear: document.getElementById("clearBtn"),
    hint: document.getElementById("stateHint"),
    aria: document.getElementById("ariaStatus"),
  };

  // --- State
  /** "idle" | "running" | "paused" */
  let mode = "idle";
  let baseStart = 0;     // ms timestamp when the current run started
  let carried = 0;       // accumulated elapsed ms from previous runs
  let rafId = null;

  // --- Utilities
  const pad2 = (n) => (n < 10 ? "0" + n : "" + n);
  const pad3 = (n) => (n < 10 ? "00" + n : n < 100 ? "0" + n : "" + n);

  function formatParts(msTotal) {
    const hours = Math.floor(msTotal / 3600000);
    const mins  = Math.floor((msTotal % 3600000) / 60000);
    const secs  = Math.floor((msTotal % 60000) / 1000);
    const ms    = Math.floor(msTotal % 1000);
    return { hours, mins, secs, ms };
  }

  function render(msTotal) {
    const { hours, mins, secs, ms } = formatParts(msTotal);
    el.hh.textContent = pad2(hours);
    el.mm.textContent = pad2(mins);
    el.ss.textContent = pad2(secs);
    el.ms.textContent = "." + pad3(ms);
  }

  function setTitleRunning(msTotal) {
    const { hours, mins, secs, ms } = formatParts(msTotal);
    document.title = `Stopwatch – ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}.${pad3(ms)}`;
  }

  function setTitleIdle() {
    document.title = "Stopwatch – 00:00:00.000";
  }

  function setToggleAppearance() {
    // Start (idle) / Pause (running) are green; Continue (paused) is blue
    if (mode === "paused") {
      el.toggle.classList.remove("btn-toggle");
      el.toggle.classList.add("btn-continue");
      el.toggle.textContent = "Continue";
      el.toggle.setAttribute("aria-pressed", "false");
      el.hint.textContent = "Paused";
      el.aria.textContent = "Paused. Press Space to continue.";
    } else if (mode === "running") {
      el.toggle.classList.remove("btn-continue");
      el.toggle.classList.add("btn-toggle");
      el.toggle.textContent = "Pause";
      el.toggle.setAttribute("aria-pressed", "true");
      el.hint.textContent = "Running";
      el.aria.textContent = "Running. Press Space to pause.";
    } else {
      el.toggle.classList.remove("btn-continue");
      el.toggle.classList.add("btn-toggle");
      el.toggle.textContent = "Start";
      el.toggle.setAttribute("aria-pressed", "false");
      el.hint.textContent = "Ready";
      el.aria.textContent = "Ready. Press Space to start.";
    }
  }

  function enableClearIfNeeded() {
    const elapsed = getElapsedNow();
    el.clear.disabled = elapsed === 0;
  }

  function getElapsedNow() {
    if (mode === "running") {
      return carried + (performance.now() - baseStart);
    }
    return carried;
  }

  // --- Core loop
  function tick() {
    const elapsed = getElapsedNow();
    render(elapsed);
    setTitleRunning(elapsed);
    enableClearIfNeeded();
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (mode === "idle") {
      carried = 0;
    }
    baseStart = performance.now();
    mode = "running";
    setToggleAppearance();
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (mode !== "running") return;
    carried += performance.now() - baseStart;
    mode = "paused";
    setToggleAppearance();
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    // Keep the last time on title; no extra "[Paused]" per spec simplicity
  }

  function resume() {
    if (mode !== "paused") return;
    baseStart = performance.now();
    mode = "running";
    setToggleAppearance();
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  function clearAll() {
    // Clear resets to zero and returns to Start state
    carried = 0;
    baseStart = 0;
    mode = "idle";
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    render(0);
    setTitleIdle();
    setToggleAppearance();
    enableClearIfNeeded();
  }

  // --- Events
  el.toggle.addEventListener("click", () => {
    if (mode === "idle") start();
    else if (mode === "running") pause();
    else resume(); // paused
  });

  el.clear.addEventListener("click", () => {
    clearAll();
  });

  // Keyboard: Space = toggle, Esc = clear
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault(); // prevent scroll / button click quirks
      if (mode === "idle") start();
      else if (mode === "running") pause();
      else resume();
    } else if (e.code === "Escape") {
      e.preventDefault();
      clearAll();
    }
  });

  // Clicking Clear while running should also reset immediately (simple behavior)
  // Clear is disabled only when elapsed is exactly zero.
  // Initialize
  render(0);
  setToggleAppearance();
  enableClearIfNeeded();
  setTitleIdle();
})();
