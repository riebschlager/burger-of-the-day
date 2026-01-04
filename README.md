# Bob's Burgers - Burger of the Day Archive

A data + web app project that archives the Bob's Burgers "Burger of the Day"
chalkboard gags. It scrapes the Fandom source page, normalizes entries into
JSON/CSV, enriches them with TVMaze episode metadata, and serves everything in
a Vue 3 + Vite single-page app.

## Repository layout

- `data/`: generated JSON/CSV outputs used by the app
- `scripts/`: the Python scraper plus a Docker helper
- `web/`: Vue 3 + Vite + Tailwind SPA

## Data sources

- Fandom: https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day
- TVMaze API: https://api.tvmaze.com

## Data outputs

- `data/burger-of-the-day.json`: `source_url`, `scraped_at`, `records[]`, and a
  `tvmaze` summary block.
- `data/burger-of-the-day.csv`: flat table of burger records.
- `data/tvmaze-episodes.json`: raw TVMaze show + episode payload.

Record fields (JSON/CSV):

- `season`
- `episode_title`
- `episode_url`
- `burger_of_the_day`
- `burger_name`
- `burger_description`
- `tvmaze_episode_id`
- `tvmaze_episode_name`
- `tvmaze_episode_number`
- `tvmaze_episode_url`
- `tvmaze_match_type` (`exact`, `fuzzy`, `missing`)
- `tvmaze_match_score`

## Scraper

The scraper parses the Fandom table by season, skips "Shorts" and "Other TV
Shows" sections by default, and optionally enriches records with TVMaze episode
metadata (exact or fuzzy title matching).

### Docker

```bash
bash scripts/run_docker.sh
```

Manual equivalent:

```bash
docker build -t burger-of-the-day-scraper .
docker run --rm -v "$PWD":/work burger-of-the-day-scraper
```

### Local Python (optional)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
python3 scripts/scrape.py
```

### Script options

```bash
python3 scripts/scrape.py \
  --url https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day \
  --output data/burger-of-the-day.json \
  --csv-output data/burger-of-the-day.csv \
  --tvmaze-show-query "Bob's Burgers" \
  --tvmaze-output data/tvmaze-episodes.json \
  --include-extra-sections \
  --skip-tvmaze
```

Notes:
- `--skip-tvmaze` disables TVMaze enrichment.
- `--include-extra-sections` includes "Shorts" and "Other TV Shows".

## Web app

The frontend lives in `web/` and loads data from `web/public/data` at runtime.
`npm run dev` and `npm run build` automatically copy the latest JSON files from
`data/` into the web app via `web/scripts/copy-data.mjs`.

Key screens and features:

- Home: stats, "this week in history", random chalkboard roulette, daily episode
  spotlight, and a custom chalkboard generator.
- Burgers: search by burger or episode name, season navigation, and grouped
  results.
- Episodes: search by episode name, filter to episodes with burgers, and season
  navigation.
- Detail pages: burger appearances with episode metadata, and episode pages with
  summaries, ratings, and linked burgers.
- Chalkboard composer: renders the chalkboard image and downloads a PNG.

### Run locally

```bash
cd web
npm install
npm run dev
```

### Build / preview

```bash
cd web
npm run build
npm run preview
```

## Deployment

Netlify is configured via `netlify.toml` (base `web`, publish `dist`) with SPA
redirects.
