# burger-of-the-day

This repo collects the "Burger of the Day" gags from Bob's Burgers and
provides a scraper that normalizes the data into JSON and CSV, plus
TVMaze episode metadata.

Source page:

https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day

## Data

- `data/burger-of-the-day.csv`: generated output from the scraper
- `data/burger-of-the-day.json`: generated output from the scraper
- `data/tvmaze-episodes.json`: full TVMaze show + episode metadata (generated)

## Docker workflow

Run the scraper in Docker so dependencies are handled inside the container:

```bash
bash scripts/run_docker.sh
```

Manual equivalent:

```bash
docker build -t burger-of-the-day-scraper .
docker run --rm -v "$PWD":/work burger-of-the-day-scraper
```

By default the scraper also pulls TVMaze episode metadata; use `--skip-tvmaze`
to disable.
By default the scraper skips the "Shorts" and "Other TV Shows" sections;
use `--include-extra-sections` to include them.

## Script options

The scraper supports optional overrides:

```bash
python scripts/scrape.py --url https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day --output data/burger-of-the-day.json --csv-output data/burger-of-the-day.csv --tvmaze-show-query "Bob's Burgers" --tvmaze-output data/tvmaze-episodes.json
```

## Web app

The Vue + Vite SPA lives in `web/`. It copies the generated JSON into
`web/public/data` during the build so the UI can fetch it at runtime.

```bash
cd web
npm install
npm run dev
```

Build output is configured for Netlify with `netlify.toml` at the repo root.
