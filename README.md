# GTA VI Trophy Guide & Tracker

An offline, single-page trophy guide and progress tracker for the 55 PlayStation 5
trophies of *Grand Theft Auto VI*. Everything loads from local files — no CDN, no web
fonts, no network requests, no build step at serve time.

## How to open it

Open `app/index.html` in any modern browser (double-click it, or drag it into a
browser window). It works from `file://` with no server required. If you'd rather
serve it locally:

```
python -m http.server 8080 --directory app
# then visit http://localhost:8080
```

Your checkmarked progress is saved to `localStorage`, so it survives reloads and
browser restarts on the same machine.

## What each view does

- **Checklist** — all 55 trophies as compact rows: grade chip, name, one-line
  description, and a tick box. Click any row to open a detail panel with the full
  guide, the missable warning (where one applies), the roadmap stage, and source
  URLs as plain readable text.
- **Roadmap** — a six-stage ordered plan for the platinum, each stage listing the
  trophies to clear in it and why that order (the single missable trophy sits in
  Stage 1 so it can never be left behind).
- **Missables** — a dedicated view of the only trophy that can become permanently
  unobtainable, with its point-of-no-return warning.

The **progress bar** (X / 55 earned) and the per-grade counters (Platinum 0/1,
Gold 0/2, Silver 0/6, Bronze 0/46) update live. **Filters** (All / Story /
Missable / Collectibles / Activities / Online, plus by grade) combine and show a
count of what is currently listed.

The **spoiler toggle** (ON by default) hides story-trophy names and descriptions
behind "Hidden trophy — tick it off to reveal", because trophy names spoil the
plot. Ticked trophies always show their real name.

**Export / Import** copies the ticked ids to the clipboard as JSON and pastes them
back, so your progress survives moving to a different browser.

## Where the trophy data came from

`app/data/trophies.json` (and its classic-script twin `app/data/trophies.js`,
which exposes `window.TROPHIES`) holds all 55 official trophies. Trophy `id`,
`grade`, `name` and `description` are taken verbatim from the official PS5 list;
the `guide` text, `kind`, `missable`, `missableNote`, `roadmapStage` and `sources`
were written for this project. The names, tiers and descriptions were verified
against:

- Exophase — Grand Theft Auto VI (PS5) Trophy List
  (https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
- PowerPyx — GTA 6 (Grand Theft Auto VI) Trophy Guide & Roadmap
  (https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- GTA Wiki — Achievements and Trophies in Grand Theft Auto VI
  (https://gta.wiki/w/Achievements_and_Trophies_in_GTA_VI)
- GTABase — GTA 6 Trophy Guide & Achievements List
  (https://www.gtabase.com/gta-6/achievements)

The official list is 1 Platinum, 2 Gold, 6 Silver and 46 Bronze. It is a different
set of trophies from the list supplied in the original brief for this bounty — that
list was a pastiche of older GTA titles (fire truck, ambulance, taxi and vigilante
missions, arm wrestling, triathlons, and non-existent "Leonida Legend" / "Mastermind"
golds). Per the brief's instruction to use the verifiable official list and note the
correction, this project uses the real GTA VI list.

## Building the dossier

`main.ts` (run with `node main.ts`, Node 22, no install, no flags) copies `app/`
and `screenshots/` into `MAKEFUN_OUTPUT_DIR` (default `/output`) and writes
`dossier.json` there by calling `buildDossier` from the vendored
`vendor/makefun-frontend.ts`:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The run is deterministic — two runs produce byte-identical `dossier.json`.

## Honest note

This project was built by an AI agent working under a recorded session. Every line
was written by the agent using its own tools (no files were copied or downloaded
into the repository); the vendored `vendor/makefun-frontend.ts` is the one provided
file that was left untouched.
