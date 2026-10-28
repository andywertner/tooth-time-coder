# Tooth Time Coder

Made from a plan by Anthony, grade 6.

A one-screen game that helps a first grader practice brushing teeth by putting coding bars in order. A character stands at a sink, acts out a correct list, and gives a gentle hint when the order is wrong.

## How to play

1. Open `index.html` in Chrome (classroom Chromebooks use Chrome 103).
2. Look at the bars on the right. Tap a bar to add it, or drag it into **Your list**.
3. Press **Go**.
4. If the order is right, the character acts out the steps and you move to the next level.
5. If the order is wrong, a mistake star appears, the correct next bar glows for about a second, and a kind line is spoken (and shown on screen). Tap the star to take it away.
6. After Level 3, celebrate and press **Play again**.

### Levels

1. Grab brush → Brush teeth
2. Grab brush → Add toothpaste → Brush teeth
3. Grab brush → Add toothpaste → Brush top teeth → Brush bottom teeth → Rinse

Each level shows only those bars, shuffled into the wrong order.

### Zoom

Use the Zoom buttons (70, 80, 90, 100, 115, 130) so the whole app scales from the top left. The page does not scroll.

Speech and sounds start only after a click, using the browser’s built-in speech. If speech is unavailable, the words stay on screen. Progress and zoom are saved on this computer with `localStorage` only. There is no server, account, camera, or microphone.

## Anthony’s four actions

In the code (and on `window.ToothTimeCoder`):

- **look** — the bars that can be used
- **add** — put a bar on the list
- **change** — set the character’s pose (`waiting`, `holding`, `brushing`, `rinsing`, `celebrating`)
- **take away** — remove the mistake star

## Publish on GitHub Pages

1. Create a new GitHub repository (for example `tooth-time-coder`).
2. Push this folder to the `main` branch.
3. In the repo on GitHub: **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then save.
6. After a minute, open `https://<your-username>.github.io/tooth-time-coder/`.

No build step and no dependencies. GitHub Pages can serve `index.html` with relative paths as-is.

## Local open

Double-click `index.html`, or from this folder:

```bash
python3 -m http.server 8765
```

Then visit `http://localhost:8765`.
