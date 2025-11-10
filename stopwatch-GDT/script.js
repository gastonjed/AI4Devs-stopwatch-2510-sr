(() => {
  // Elements
  const el = {
    hh: document.getElementById("hh"),
    mm: document.getElementById("mm"),
    ss: document.getElementById("ss"),
    ms: document.getElementById("ms"),
    toggle: document.getElementById("toggleBtn"),
    clear: document.getElementById("clearBtn"),
    aria: document.getElementById("ariaStatus"),
  };

  // State
  let mode = "idle";    // "idle" | "running" | "paused"
  let baseStart = 0;    // ms timestamp when current run started
  let carried = 0;      // accumulated elapsed from previous runs
  let rafId = null;

  // Helpers
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
    el.ms.textContent = pad3(ms);
  }

  function setTitleRunning(msTotal) {
    const { hours, mins, secs, ms } = formatParts(msTotal);
    document.title = `Stopwatch – ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}.${pad3(ms)}`;
  }

  function setTitleIdle() {
    document.title = "Stopwatch – 00:00:00.000";
  }

  function setToggleAppearance() {
    // Start (idle) and Pause (running) use green; Continue (paused) uses blue
    if (mode === "paused") {
      el.toggle.classList.remove("btn-toggle");
      el.toggle.classList.add("btn-continue");
      el.toggle.textContent = "Continue";
      el.toggle.setAttribute("aria-pressed", "false");
      el.aria.textContent = "Paused. Press Space to continue.";
    } else if (mode === "running") {
      el.toggle.classList.remove("btn-continue");
      el.toggle.classList.add("btn-toggle");
      el.toggle.textContent = "Pause";
      el.toggle.setAttribute("aria-pressed", "true");
      el.aria.textContent = "Running. Press Space to pause.";
    } else {
      el.toggle.classList.remove("btn-continue");
      el.toggle.classList.add("btn-toggle");
      el.toggle.textContent = "Start";
      el.toggle.setAttribute("aria-pressed", "false");
      el.aria.textContent = "Ready. Press Space to start.";
    }
  }

  function getElapsedNow() {
    if (mode === "running") {
      return carried + (performance.now() - baseStart);
    }
    return carried;
  }

  function enableClearIfNeeded() {
    el.clear.disabled = getElapsedNow() === 0;
  }

  // Loop
  function tick() {
    const elapsed = getElapsedNow();
    render(elapsed);
    setTitleRunning(elapsed);
    enableClearIfNeeded();
    rafId = requestAnimationFrame(tick);
  }

  // Actions
  function start() {
    if (mode === "idle") carried = 0;
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
    // Keep last time in title while paused
  }

  function resume() {
    if (mode !== "paused") return;
    baseStart = performance.now();
    mode = "running";
    setToggleAppearance();
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  function clearAll() {
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

  // Events
  el.toggle.addEventListener("click", () => {
    if (mode === "idle") start();
    else if (mode === "running") pause();
    else resume();
  });

  el.clear.addEventListener("click", clearAll);

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (mode === "idle") start();
      else if (mode === "running") pause();
      else resume();
    } else if (e.code === "Escape") {
      e.preventDefault();
      clearAll();
    }
  });

  // Init
  render(0);
  setToggleAppearance();
  enableClearIfNeeded();
  setTitleIdle();
})();
