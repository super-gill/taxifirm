# Taxi Firm

A browser management game about running a cut-throat taxi firm. The UI is built around a live map of the city: your cabs, traffic, customers, hotspots and rival firms are all on it.

This repo holds the **Act 1 prototype**: a small fictional market town, Wexmoor, where you start as the only driver of Starline Cabs and grow into a small rostered fleet against a rival, Castle Cars. In the full game this act becomes the tutorial, before the big city and the firm wars.

Play it: https://super-gill.github.io/taxifirm/

## How it plays

- You are one of your firm's drivers. On shift, you pick fares, choose routes and chat to passengers. The car drives itself.
- While you carry a fare, business decisions are locked. You can bail out of a job at a reputation cost.
- Off shift, you run the firm: rent an office, hire drivers and an operator, lease or buy cabs, hire a mechanic.
- Everyone, you included, works a shift on one cab. Several drivers can share a cab if their shifts don't overlap.
- When nobody is on shift, the clock fast-forwards to the next shift start.
- Act 1 is about leasing: build to four staffed cabs, then take yourself off the rota. Buying cabs opens in Act 2.

## Running it locally

It's plain HTML, CSS and JavaScript with no build step. Any static server works:

```
python -m http.server 8765
```

Then open http://localhost:8765/. Opening `index.html` straight from disk also works.

## Layout

| Path | What it holds |
| --- | --- |
| `index.html` | Page markup and script order |
| `css/style.css` | All styling |
| `js/util.js` | Helpers, random numbers, colours |
| `js/town.js` | The town as data: districts, road graph, ranks, pathfinding, passenger lines |
| `js/state.js` | Game state, new game setup, logging and toasts |
| `js/sim.js` | Traffic, customers, cab movement, driver decisions, shifts, the clock, day end |
| `js/actions.js` | Everything the player can do |
| `js/map.js` | Map clicks and canvas drawing |
| `js/ui.js` | Side panel, overlays, speed controls, input events |
| `js/main.js` | Main loop, saving and loading, boot |
| `docs/prototype-spec.md` | The prototype spec |
| `tools/harness.js` | Headless balance harness |

The simulation only ever sees the road graph in `town.js`, so the town can be swapped for a bigger city without rewriting the sim.

## Balance harness

`tools/harness.js` runs the real sim files in Node with no screen, following fixed strategies, and prints daily cash, profit and jobs:

```
node tools/harness.js all 14 4
```

Arguments are strategy (`solo`, `lease`, `lease-fast` or `all`), days and seeds. Set `COSTS=1` for a daily cost breakdown.

## Saves

The game saves to the browser's local storage every few seconds, and when the tab closes. Saves are per browser. Start over from the Ledger tab.

## Deployment

GitHub Pages, served from the repo root (`.nojekyll` is present).

See `CHANGELOG.md` for version history.
