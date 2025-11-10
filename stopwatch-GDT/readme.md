## Usage & Technical Notes

* **Start / Pause / Continue (Space):** Single toggle button. Green for **Start** and **Pause**, blue for **Continue**.
* **Clear (Esc):** Resets to `00:00:00.000`, disables when already zero.

**UI & Updates**

* Layout mimics the screenshot: large rounded display with light lavender background and thick dark border; milliseconds sit at the lower-right of the display in a smaller size; large rounded buttons with thick borders and subtle gradient.
* The document title shows the live time while running.

**State & Logic**

* States: `idle → running → paused`, with **Clear** returning to `idle`.
* Rendering uses `requestAnimationFrame` with `performance.now()` for smooth, accurate timing.

**Limitations**

* No persistence; a page reload resets the stopwatch.
* Works on modern browsers (Chromium, Firefox, Safari, Edge).
