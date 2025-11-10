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

  /**
   * Split a total duration in milliseconds into whole hours, minutes, seconds, and remaining milliseconds.
   * @param {number} msTotal - Total duration in milliseconds (expected >= 0).
   * @returns {{hours: number, mins: number, secs: number, ms: number}} An object with `hours`, `mins`, `secs` (whole units) and `ms` (remaining milliseconds).
   */
  function formatParts(msTotal) {
    const hours = Math.floor(msTotal / 3600000);
    const mins  = Math.floor((msTotal % 3600000) / 60000);
    const secs  = Math.floor((msTotal % 60000) / 1000);
    const ms    = Math.floor(msTotal % 1000);
    return { hours, mins, secs, ms };
  }

  /**
   * Update the visible stopwatch fields to reflect a total elapsed time.
   * @param {number} msTotal - Total elapsed time in milliseconds (zero or greater).
   */
  function render(msTotal) {
    const { hours, mins, secs, ms } = formatParts(msTotal);
    el.hh.textContent = pad2(hours);
    el.mm.textContent = pad2(mins);
    el.ss.textContent = pad2(secs);
    el.ms.textContent = pad3(ms);
  }

  /**
   * Update the document title to show the current stopwatch time.
   * @param {number} msTotal - Elapsed time in milliseconds to display in the title as `HH:MM:SS.mmm`.
   */
  function setTitleRunning(msTotal) {
    const { hours, mins, secs, ms } = formatParts(msTotal);
    document.title = `Stopwatch – ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}.${pad3(ms)}`;
  }

  /**
   * Update the document title to the stopwatch idle (reset) state.
   *
   * Sets the title to "Stopwatch – 00:00:00.000".
   */
  function setTitleIdle() {
    document.title = "Stopwatch – 00:00:00.000";
  }

  /**
   * Update the toggle button's appearance, label, ARIA pressed state, and aria status text to reflect the current stopwatch mode.
   *
   * When mode is "paused", the button shows "Continue" with the `btn-continue` styling and aria status "Paused. Press Space to continue.".
   * When mode is "running", the button shows "Pause" with the `btn-toggle` styling, aria-pressed="true", and aria status "Running. Press Space to pause.".
   * When mode is "idle", the button shows "Start" with the `btn-toggle` styling, aria-pressed="false", and aria status "Ready. Press Space to start.".
   */
  function setToggleAppearance() {
    // Start (idle) & Pause (running) => green, Continue (paused) => blue
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

  /**
   * Compute the total elapsed time for the stopwatch in milliseconds.
   *
   * @returns {number} Total elapsed time in milliseconds, including the current running interval when the stopwatch is running.
   */
  function getElapsedNow() {
    if (mode === "running") {
      return carried + (performance.now() - baseStart);
    }
    return carried;
  }

  /**
   * Updates the Clear button's disabled state based on whether any time has elapsed.
   *
   * Sets the Clear button to disabled when the elapsed time is equal to 0; enables it otherwise.
   */
  function enableClearIfNeeded() {
    el.clear.disabled = getElapsedNow() === 0;
  }

  /**
   * Updates the stopwatch display, document title, and Clear-button state, then schedules the next frame.
   *
   * Performs a single tick: obtains current elapsed time, renders it to the DOM, updates the running title, enables or disables the Clear button as needed, and queues the next call via requestAnimationFrame.
   */
  function tick() {
    const elapsed = getElapsedNow();
    render(elapsed);
    setTitleRunning(elapsed);
    enableClearIfNeeded();
    rafId = requestAnimationFrame(tick);
  }

  /**
   * Start or resume the stopwatch.
   *
   * If the stopwatch was idle, clears previously accumulated elapsed time. Sets the current start timestamp, switches the internal mode to "running", updates the toggle button appearance, and ensures the ticking loop is active.
   */
  function start() {
    if (mode === "idle") carried = 0;
    baseStart = performance.now();
    mode = "running";
    setToggleAppearance();
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  /**
   * Pause the running stopwatch.
   *
   * If the stopwatch is currently running, adds the time elapsed since the current run started to the accumulated
   * carried time, sets the mode to "paused", updates the toggle button appearance/ARIA, and cancels the animation frame
   * loop. Does nothing if the stopwatch is not running.
   */
  function pause() {
    if (mode !== "running") return;
    carried += performance.now() - baseStart;
    mode = "paused";
    setToggleAppearance();
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /**
   * Resume the stopwatch from the paused state, restart the internal timer, and resume visual updates.
   *
   * Has no effect unless the stopwatch is currently paused. Updates the toggle button appearance and
   * restarts the animation loop that updates the displayed time and document title.
   */
  function resume() {
    if (mode !== "paused") return;
    baseStart = performance.now();
    mode = "running";
    setToggleAppearance();
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  /**
   * Reset the stopwatch to its initial (idle) state and refresh the UI.
   *
   * Sets elapsed time to zero, switches mode to "idle", cancels any active animation frame,
   * renders a zeroed time display, resets the document title, updates the toggle button appearance,
   * and enables/disables the Clear button as appropriate.
   */
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