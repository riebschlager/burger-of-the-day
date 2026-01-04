#!/usr/bin/env python3
import argparse
import csv
import difflib
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

SOURCE_URL = "https://bobs-burgers.fandom.com/wiki/Burger_of_the_Day"
TVMAZE_SINGLESEARCH_URL = "https://api.tvmaze.com/singlesearch/shows"
TVMAZE_EPISODES_URL = "https://api.tvmaze.com/shows/{show_id}/episodes"
DEFAULT_TVMAZE_QUERY = "Bob's Burgers"
USER_AGENT = "burger-of-the-day-scraper/1.0"
EXTRA_SECTION_TITLES = {
    "shorts",
    "other tv shows",
    "other tv show",
    "other tv series",
}
EXCLUDED_BURGER_TEXTS = {
    "same as wharf horse since both episodes take place on the same day",
    "there were no burgers of the day in this episode but in the hugo s hot dogs segment a hot dog of the day appeared which was the a view to a kielbasa dog which is a reference to the 1985 james bond movie a view to a kill",
}


def clean_whitespace(text):
    return re.sub(r"\s+", " ", text or "").strip()


def normalize_title(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = text.replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return clean_whitespace(text)


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

    if not full_text:
        return None, None, None

    burger_name = None
    burger_description = None

    bolds = cell.find_all("b")
    if bolds:
        bold_texts = [clean_whitespace(bold.get_text(" ", strip=True)) for bold in bolds]
        first_bold = bold_texts[0]

        if len(bold_texts) == 1 and first_bold.endswith(":") and full_text == first_bold:
            return None, None, None

        if first_bold.endswith(":") and len(bold_texts) > 1:
            burger_name = next((text for text in bold_texts[1:] if text), None)
            parts = [clean_whitespace(s) for s in cell.stripped_strings]

            extra = []
            skipped_label = False
            skipped_burger = False
            for part in parts:
                if not skipped_label and part == first_bold:
                    skipped_label = True
                    continue
                if not skipped_burger and burger_name and part == burger_name:
                    skipped_burger = True
                    continue
                extra.append(part)

            description = " ".join(extra).strip()
            if description.startswith("(") and description.endswith(")"):
                description = description[1:-1].strip()
            burger_description = description or None

            burger_text = burger_name or full_text
            if burger_description:
                burger_text = f"{burger_text} ({burger_description})"
            return burger_text, burger_name or burger_text, burger_description

        burger_name = first_bold
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


def heading_text(heading):
    span = heading.find("span", class_="mw-headline")
    if span:
        return clean_whitespace(span.get_text(" ", strip=True))
    return clean_whitespace(heading.get_text(" ", strip=True))


def is_extra_section(title):
    if not title:
        return False
    normalized = normalize_title(title)
    return normalized in EXTRA_SECTION_TITLES


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
        if burger_text is None:
            continue
        if normalize_title(burger_text) in EXCLUDED_BURGER_TEXTS:
            continue
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


def scrape(url, include_extras=False):
    response = requests.get(url, timeout=30, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    records = []
    current_season = None

    for element in soup.find_all(["h2", "h3", "table"]):
        if element.name in {"h2", "h3"}:
            season = parse_season(element)
            if season is not None:
                current_season = season
                continue

            if not include_extras and is_extra_section(heading_text(element)):
                current_season = None
            continue

        if element.name == "table" and "BOTD" in (element.get("class") or []):
            if current_season is None:
                continue
            records.extend(parse_table(element, current_season))

    if not records:
        raise RuntimeError("No burger records found. The page layout may have changed.")

    return records


def fetch_tvmaze(show_query):
    response = requests.get(
        TVMAZE_SINGLESEARCH_URL,
        params={"q": show_query, "embed": "episodes"},
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    response.raise_for_status()

    show = response.json()
    episodes = show.get("_embedded", {}).get("episodes")
    if episodes is None:
        show_id = show.get("id")
        if show_id is None:
            raise RuntimeError("TVMaze response missing show id.")
        episodes_response = requests.get(
            TVMAZE_EPISODES_URL.format(show_id=show_id),
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        episodes_response.raise_for_status()
        episodes = episodes_response.json()

    return show, episodes


def write_tvmaze(show, episodes, output_path, show_query):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    show_data = dict(show)
    show_data.pop("_embedded", None)

    payload = {
        "show_query": show_query,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "show": show_data,
        "episodes": episodes,
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    return payload


def build_tvmaze_index(episodes):
    index = {}
    for episode in episodes:
        season = episode.get("season")
        name = episode.get("name")
        if season is None or not name:
            continue
        key = normalize_title(name)
        if not key:
            continue
        index.setdefault(season, {}).setdefault(key, []).append(episode)
    return index


def match_tvmaze_episode(record, index):
    season = record.get("season")
    title = record.get("episode_title")
    if season is None or not title:
        return None, "missing", None

    season_index = index.get(season, {})
    if not season_index:
        return None, "missing", None

    normalized = normalize_title(title)
    if not normalized:
        return None, "missing", None

    exact = season_index.get(normalized)
    if exact:
        return exact[0], "exact", 1.0

    best_episode = None
    best_score = 0.0
    for key, episodes in season_index.items():
        score = difflib.SequenceMatcher(None, normalized, key).ratio()
        if score > best_score:
            best_score = score
            best_episode = episodes[0]

    if best_episode and best_score >= 0.86:
        return best_episode, "fuzzy", round(best_score, 3)

    return None, "missing", None


def enrich_records_with_tvmaze(records, episodes):
    index = build_tvmaze_index(episodes)
    for record in records:
        episode, match_type, match_score = match_tvmaze_episode(record, index)
        if episode:
            record["tvmaze_episode_id"] = episode.get("id")
            record["tvmaze_episode_name"] = episode.get("name")
            record["tvmaze_episode_number"] = episode.get("number")
            record["tvmaze_episode_url"] = episode.get("url")
        else:
            record["tvmaze_episode_id"] = None
            record["tvmaze_episode_name"] = None
            record["tvmaze_episode_number"] = None
            record["tvmaze_episode_url"] = None

        record["tvmaze_match_type"] = match_type
        record["tvmaze_match_score"] = match_score


def write_csv(records, output_path):
    fieldnames = [
        "season",
        "episode_title",
        "episode_url",
        "burger_of_the_day",
        "burger_name",
        "burger_description",
        "tvmaze_episode_id",
        "tvmaze_episode_name",
        "tvmaze_episode_number",
        "tvmaze_episode_url",
        "tvmaze_match_type",
        "tvmaze_match_score",
    ]

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow({key: record.get(key) for key in fieldnames})


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Burger of the Day entries into JSON and CSV."
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
    parser.add_argument(
        "--csv-output",
        default="data/burger-of-the-day.csv",
        help="Output CSV path.",
    )
    parser.add_argument(
        "--tvmaze-show-query",
        default=DEFAULT_TVMAZE_QUERY,
        help="Show name to search on TVMaze.",
    )
    parser.add_argument(
        "--tvmaze-output",
        default="data/tvmaze-episodes.json",
        help="Output JSON path for TVMaze show and episode data.",
    )
    parser.add_argument(
        "--include-extra-sections",
        action="store_true",
        help="Include Shorts and Other TV Shows sections from the source page.",
    )
    parser.add_argument(
        "--skip-tvmaze",
        action="store_true",
        help="Skip TVMaze enrichment.",
    )
    args = parser.parse_args()

    records = scrape(args.url, include_extras=args.include_extra_sections)

    tvmaze_payload = None
    if not args.skip_tvmaze:
        tvmaze_show, tvmaze_episodes = fetch_tvmaze(args.tvmaze_show_query)
        tvmaze_payload = write_tvmaze(
            tvmaze_show, tvmaze_episodes, args.tvmaze_output, args.tvmaze_show_query
        )
        enrich_records_with_tvmaze(records, tvmaze_episodes)

    payload = {
        "source_url": args.url,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }

    if tvmaze_payload:
        match_counts = {"exact": 0, "fuzzy": 0, "missing": 0}
        for record in records:
            match_type = record.get("tvmaze_match_type") or "missing"
            if match_type not in match_counts:
                match_counts[match_type] = 0
            match_counts[match_type] += 1

        payload["tvmaze"] = {
            "show_query": args.tvmaze_show_query,
            "retrieved_at": tvmaze_payload["retrieved_at"],
            "show_id": tvmaze_payload["show"].get("id"),
            "show_name": tvmaze_payload["show"].get("name"),
            "episode_count": len(tvmaze_payload["episodes"]),
            "output": args.tvmaze_output,
            "match_counts": match_counts,
        }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    write_csv(records, args.csv_output)

    print(f"Wrote {len(records)} records to {output_path}")
    print(f"Wrote {len(records)} records to {args.csv_output}")
    if tvmaze_payload:
        print(f"Wrote TVMaze data to {args.tvmaze_output}")


if __name__ == "__main__":
    main()
