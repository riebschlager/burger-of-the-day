import { slugify } from "./slug";
import { formatEpisodeCode } from "./date";
import { stripHtml, stripWrappingQuotes, toSentenceCase } from "./text";
import type {
  BurgerContextFile,
  BurgerDataFile,
  BurgerRecord,
  TvmazeEpisode,
  TvmazePayload,
} from "./types";

export interface BurgerRecordView extends BurgerRecord {
  burgerSlug: string;
  burgerDisplay: string;
  episodeCode: string;
  referenceNotes?: string[];
}

export interface EpisodeView extends TvmazeEpisode {
  code: string;
  summaryText: string;
  ratingValue: number | null;
}

export interface BurgerDataBundle {
  burgerFile: BurgerDataFile;
  tvmazeFile: TvmazePayload;
  records: BurgerRecordView[];
  episodes: EpisodeView[];
  episodesById: Map<number, EpisodeView>;
  episodesByCode: Map<string, EpisodeView>;
  burgersBySlug: Map<string, BurgerRecordView[]>;
  burgersByEpisodeId: Map<number, BurgerRecordView[]>;
}

let cachedBundle: BurgerDataBundle | null = null;
let pendingPromise: Promise<BurgerDataBundle> | null = null;

function buildEpisodeView(episode: TvmazeEpisode): EpisodeView {
  return {
    ...episode,
    code: formatEpisodeCode(episode.season, episode.number),
    summaryText: stripHtml(episode.summary || ""),
    ratingValue: episode.rating?.average ?? null,
  };
}

const normalizeKeyPart = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const buildContextKey = (season: number, episodeTitle: string, burgerOfTheDay: string) =>
  `${season}::${normalizeKeyPart(episodeTitle)}::${normalizeKeyPart(burgerOfTheDay)}`;

function buildRecordView(
  record: BurgerRecord,
  contextNotesByKey?: Map<string, string[]>
): BurgerRecordView {
  const rawName = record.burger_name ? stripWrappingQuotes(record.burger_name) : null;
  const rawOfTheDay = record.burger_of_the_day
    ? stripWrappingQuotes(record.burger_of_the_day)
    : null;
  const displaySource = rawName || rawOfTheDay || "Unknown";
  const display = stripWrappingQuotes(displaySource);

  const trailingDescriptionMatch = rawOfTheDay?.match(/\(([^)]+)\)\s*$/);
  const descriptionSource =
    record.burger_description ||
    (rawName && rawOfTheDay && rawOfTheDay.startsWith(rawName) && trailingDescriptionMatch
      ? trailingDescriptionMatch[1]
      : null);
  const normalizedName = display.toUpperCase();
  const normalizedDescription = descriptionSource
    ? toSentenceCase(stripWrappingQuotes(descriptionSource))
    : null;
  const normalizedOfTheDay = normalizedDescription
    ? `${normalizedName} (${normalizedDescription})`
    : normalizedName;
  const contextKey = buildContextKey(
    record.season,
    record.episode_title,
    record.burger_of_the_day
  );
  const referenceNotes = contextNotesByKey?.get(contextKey);

  return {
    ...record,
    burger_name: rawName ? normalizedName : null,
    burger_of_the_day: normalizedOfTheDay,
    burger_description: normalizedDescription,
    burgerDisplay: normalizedName,
    burgerSlug: slugify(normalizedName),
    episodeCode: formatEpisodeCode(record.season, record.tvmaze_episode_number),
    referenceNotes,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

export async function loadBurgerData(): Promise<BurgerDataBundle> {
  if (cachedBundle) return cachedBundle;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    const [burgerFile, tvmazeFile, contextFile] = await Promise.all([
      fetchJson<BurgerDataFile>("data/burger-of-the-day.json"),
      fetchJson<TvmazePayload>("data/tvmaze-episodes.json"),
      fetchOptionalJson<BurgerContextFile>("data/burger-of-the-day-context.json"),
    ]);

    const episodes = tvmazeFile.episodes.map(buildEpisodeView).sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.number - b.number;
    });

    const episodesById = new Map<number, EpisodeView>();
    const episodesByCode = new Map<string, EpisodeView>();
    episodes.forEach((episode) => {
      episodesById.set(episode.id, episode);
      episodesByCode.set(episode.code, episode);
    });

    const contextNotesByKey = new Map<string, string[]>();
    if (contextFile) {
      contextFile.records.forEach((record) => {
        if (!record.notes?.length) return;
        const key = buildContextKey(
          record.season,
          record.episode_title,
          record.burger_of_the_day
        );
        contextNotesByKey.set(key, record.notes);
      });
    }

    const records = burgerFile.records.map((record) =>
      buildRecordView(record, contextNotesByKey)
    );

    const burgersBySlug = new Map<string, BurgerRecordView[]>();
    const burgersByEpisodeId = new Map<number, BurgerRecordView[]>();

    records.forEach((record) => {
      const slugRecords = burgersBySlug.get(record.burgerSlug) || [];
      slugRecords.push(record);
      burgersBySlug.set(record.burgerSlug, slugRecords);

      if (record.tvmaze_episode_id) {
        const episodeRecords =
          burgersByEpisodeId.get(record.tvmaze_episode_id) || [];
        episodeRecords.push(record);
        burgersByEpisodeId.set(record.tvmaze_episode_id, episodeRecords);
      }
    });

    const bundle: BurgerDataBundle = {
      burgerFile,
      tvmazeFile,
      records,
      episodes,
      episodesById,
      episodesByCode,
      burgersBySlug,
      burgersByEpisodeId,
    };

    cachedBundle = bundle;
    return bundle;
  })();

  return pendingPromise;
}
