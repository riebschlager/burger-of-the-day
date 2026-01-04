# burger-of-the-day

This repo collects the "Burger of the Day" gags from Bob's Burgers and
provides a scraper that normalizes the data into JSON.

Source page:

https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day

## Data

- `data/burger-of-the-day.csv`: generated output from the scraper
- `data/burger-of-the-day.json`: generated output from the scraper

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

## Script options

The scraper supports optional overrides:

```bash
python scripts/scrape.py --url https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day --output data/burger-of-the-day.json --csv-output data/burger-of-the-day.csv
```
