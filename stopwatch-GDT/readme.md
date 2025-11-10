## Usage & Technical Notes

**Controls**

* **Toggle button (green/blue):**

  * **Start** (green) → begins counting from `00:00:00.000`.
  * **Pause** (green) → pauses the running stopwatch.
  * **Continue** (blue) → resumes from the paused time.
* **Clear (red):** Resets to `00:00:00.000` and returns the toggle button to **Start**. Disabled when already at zero.
* **Keyboard shortcuts:**

  * **Space** → Start / Pause / Continue (depending on state).
  * **Esc** → Clear.

**Display & Updates**

* Time shows as **HH:MM:SS** with **milliseconds** in a smaller font, matching the requested style.
* While running, the **document title** updates with the live time.
* The UI updates via `requestAnimationFrame` for smooth rendering and accurate timing using `performance.now()`.

**State & Transitions**

* States: `idle → running → paused → running …` or `Clear → idle`.
* **Clear** is available whenever the elapsed time is non-zero; pressing it stops and resets the stopwatch.

**Limitations / Requirements**

* No persistence: reloading the page restarts the stopwatch at zero.
* Pure HTML/CSS/JS in two files (no external CSS). Works in modern browsers (Chromium, Firefox, Safari) that support `requestAnimationFrame` and `performance.now()`.
