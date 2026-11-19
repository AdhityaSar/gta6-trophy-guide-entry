# GTA VI Trophy Guide & Tracker

An offline, single-page trophy guide and progress tracker for the 55 PlayStation 5
trophies in Grand Theft Auto VI.

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/AdhityaSar/gta6-trophy-guide-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/AdhityaSar/gta6-trophy-guide-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

This entry was built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

A dark, dense, single-page tool that works entirely from local files — no CDN, no web
fonts, no network, no build step. Open `app/index.html` in a browser and it runs.
It ships 55 trophies with official names and descriptions, plus an original guide
(300–900 characters) for each one, a missable-trophy warning, and a cited sources
block for every entry.

## How to open it

No server needed. Either double-click `app/index.html`, or serve the folder locally:

```
cd app
python -m http.server 8090
```

then open `http://localhost:8090/`. Because everything is a relative path inside
`app/`, the page loads identically from `file://` and from a local server.

## The views

- **Checklist** — all 55 trophies as compact rows (grade chip, name, one-line
  description, tick box). Click a row to open its detail panel. With the "Hide
  spoilers" toggle on (default), the 28 story trophies show `Hidden trophy — tick it
  off to reveal` until you tick them; ticked trophies always reveal.
- **Detail panel** — the selected trophy's grade, name, description, a `GUIDE` section,
  a missable warning when relevant, and a `SOURCES` block with each source's title,
  URL and `retrieved 2026-11-19` date.
- **Roadmap** — a summary line and six stage cards, each listing its trophies as grade
  letter + name + kind, with a ★ for the one missable.
- **Missables** — only the missable trophy, with its warning and point of no return.

A thin audit strip under the header reports data completeness, computed from the data
at load time: `Trophies 55/55 · Guides 55/55 · Cited 55/55 · Dated 55/55 · Missable 1 ·
Online 0 · Stages 6`. Progress persists in `localStorage`; Export writes the ticked ids
as JSON to the textarea and Import reads them back. Kind and grade filters combine and
report `Showing N of 55`.

The page also honours URL parameters for screenshots and deep-linking:
`?view=list|roadmap|missables`, `?spoiler=on|off`, `?trophy=<id>`.

## Where the trophy data came from

The 55 official trophy grades, names and descriptions are the PlayStation strings,
copied verbatim. Guides were written against these consulted sources, each cited in
the data with a `retrieved` date of 2026-11-19:

- Exophase — Grand Theft Auto VI Trophies (PS5)
- PowerPyx — GTA 6 Trophy Guide & Roadmap
- PowerPyx — GTA 6 100% Completion Checklist & Guide
- PowerPyx — GTA 6 All Challenges Guide
- PowerPyx — GTA 6 All Meditation Spot Locations
- PowerPyx — GTA 6 All Stunt Jump Locations
- PowerPyx — GTA 6 All Top Fun Drone Race Locations
- GTABase — GTA 6 Achievements
- GTA Wiki — Achievements and Trophies in GTA VI

The full URLs live in `app/data/trophies.json` on each trophy's `sources` field.

## Build & dossier

`main.ts` (Node 22, standard library only, run directly by `node main.ts`) copies
`app/` and `screenshots/` into `MAKEFUN_OUTPUT_DIR` (default `/output`) and writes
`dossier.json` there via `buildDossier` from `vendor/makefun-frontend.ts`. It empties
the output directory's contents (never removing the directory itself, so it survives
the grader's read-only root filesystem) and is deterministic — two runs write
identical bytes.

## An honest note

This project was built by an AI agent during a recorded session. The trophy facts are
copied from the official PlayStation list and the cited third-party guides; the guide
text, layout and code are the agent's own writing, produced for this bounty. If a
guide's advice looks wrong for the game you're playing, trust the game and the linked
sources over this page.
