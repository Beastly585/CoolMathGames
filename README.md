# 🕹️ Arcade — CoolMath Games

A collection of five classic arcade games built in vanilla JavaScript, HTML, and CSS. No frameworks, no build step — just open `index.html` in a browser.

**Dark neon aesthetic** — deep space background, glowing neon strokes, CRT scanline overlay.

---

## Games

| Game | Controls | Description |
|---|---|---|
| **Snake** | ← → ↑ ↓ | Eat food, grow, don't bite yourself |
| **Flappy** | Space / tap | Flap through the pipes |
| **Breakout** | ← → / mouse | Clear all the bricks without dropping the ball |
| **Tetris** | ← → ↑ ↓ / Space | Stack pieces, clear lines |
| **Asteroids** | ← → ↑ + Space | Rotate, thrust, shoot the rocks |

---

## How to run

```bash
# Option 1 — open directly
open index.html

# Option 2 — local server
npx serve .
```

No dependencies. Works in any modern browser.

---

## Structure

```
arcade/
├── index.html   # App shell, hub UI, game screen, overlays
├── style.css    # Full neon/CRT design system
├── games.js     # Arcade engine + all 5 games
└── README.md
```

All five games live in `games.js` as factory functions (`makeSnake`, `makeFlappy`, etc.), each returning a standard `{ init, update, render, mobile, destroy }` interface driven by a shared `requestAnimationFrame` loop.

---

## Background

Built to practice and demonstrate vanilla JavaScript — DOM manipulation, canvas 2D rendering, game loop patterns, collision detection, and keyboard/touch input handling. The original project was a single Snake game; this version expands it into a full five-game arcade.
