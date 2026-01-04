#!/usr/bin/env python3
import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

SOURCE_URL = "https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day"


def clean_whitespace(text):
    return re.sub(r"\s+", " ", text or "").strip()


def strip_wrapping_quotes(text):
    text = text.strip()
    if len(text) >= 2 and text[0] == text[-1] == '"':
        return text[1:-1].strip()
    return text


def is_episode_cell(cell):
    bold = cell.find("b")
    if not bold:
        return False
    return bold.find("a", href=True) is not None


def extract_episode(cell):
    text = clean_whitespace(cell.get_text(" ", strip=True))
    text = strip_wrapping_quotes(text)

    link = cell.find("a", href=True)
    url = None
    if link:
        href = link.get("href", "").strip()
        if href.startswith("/"):
            url = "https://bobs-burgers.fandom.com" + href
        else:
            url = href or None

    return text, url


def extract_burger(cell):
    full_text = clean_whitespace(cell.get_text(" ", strip=True))

    burger_name = None
    burger_description = None

    bold = cell.find("b")
    if bold:
        burger_name = clean_whitespace(bold.get_text(" ", strip=True))
        parts = [clean_whitespace(s) for s in cell.stripped_strings]
        if parts:
            if parts[0] == burger_name:
                extra = parts[1:]
            else:
                extra = [part for part in parts if part != burger_name]

            if extra:
                description = " ".join(extra).strip()
                if description.startswith("(") and description.endswith(")"):
                    description = description[1:-1].strip()
                burger_description = description or None

    return full_text, burger_name, burger_description


def parse_season(heading):
    span = heading.find("span", class_="mw-headline")
    if not span:
        return None
    text = clean_whitespace(span.get_text(" ", strip=True))
    match = re.search(r"Season\s+(\d+)", text)
    if match:
        return int(match.group(1))
    return None


def parse_table(table, season):
    entries = []
    current_episode = None
    current_episode_url = None

    for row in table.find_all("tr"):
        cells = row.find_all("td", recursive=False)
        if not cells:
            continue

        burger_cell = None

        if len(cells) == 3:
            episode_cell, burger_cell, _reference_cell = cells
            if is_episode_cell(episode_cell):
                current_episode, current_episode_url = extract_episode(episode_cell)
        elif len(cells) == 2:
            first, second = cells
            if is_episode_cell(first):
                current_episode, current_episode_url = extract_episode(first)
                burger_cell = second
            else:
                burger_cell = first
        elif len(cells) == 1:
            burger_cell = cells[0]

        if not burger_cell or not current_episode:
            continue

        burger_text, burger_name, burger_description = extract_burger(burger_cell)
        entries.append(
            {
                "season": season,
                "episode_title": current_episode,
                "episode_url": current_episode_url,
                "burger_of_the_day": burger_text,
                "burger_name": burger_name,
                "burger_description": burger_description,
            }
        )

    return entries


def scrape(url):
    response = requests.get(url, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    records = []
    current_season = None

    for element in soup.find_all(["h2", "table"]):
        if element.name == "h2":
            season = parse_season(element)
            if season is not None:
                current_season = season
            continue

        if element.name == "table" and "BOTD" in (element.get("class") or []):
            if current_season is None:
                continue
            records.extend(parse_table(element, current_season))

    if not records:
        raise RuntimeError("No burger records found. The page layout may have changed.")

    return records


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Burger of the Day entries into JSON."
    )
    parser.add_argument(
        "--url",
        default=SOURCE_URL,
        help="Source page to scrape.",
    )
    parser.add_argument(
        "--output",
        default="data/burger-of-the-day.json",
        help="Output JSON path.",
    )
    args = parser.parse_args()

    records = scrape(args.url)
    payload = {
        "source_url": args.url,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print(f"Wrote {len(records)} records to {output_path}")


if __name__ == "__main__":
    main()
