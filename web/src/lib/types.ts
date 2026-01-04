export interface BurgerRecord {
  season: number;
  episode_title: string;
  episode_url: string | null;
  burger_of_the_day: string;
  burger_name: string | null;
  burger_description: string | null;
  tvmaze_episode_id: number | null;
  tvmaze_episode_name: string | null;
  tvmaze_episode_number: number | null;
  tvmaze_episode_url: string | null;
  tvmaze_match_type: "exact" | "fuzzy" | "missing" | string;
  tvmaze_match_score: number | null;
}

export interface BurgerDataFile {
  source_url: string;
  scraped_at: string;
  records: BurgerRecord[];
  tvmaze?: {
    show_query: string;
    retrieved_at: string;
    show_id: number | null;
    show_name: string | null;
    episode_count: number | null;
    output: string;
    match_counts: Record<string, number>;
  };
}

export interface BurgerContextRecord {
  season: number;
  episode_title: string;
  episode_url: string | null;
  burger_of_the_day: string;
  burger_name: string | null;
  burger_description: string | null;
  notes: string[];
}

export interface BurgerContextFile {
  source_url: string;
  scraped_at: string;
  records: BurgerContextRecord[];
}

export interface TvmazeEpisode {
  id: number;
  url?: string;
  name: string;
  season: number;
  number: number;
  type?: string;
  airdate?: string | null;
  airtime?: string | null;
  airstamp?: string | null;
  runtime?: number | null;
  rating?: {
    average: number | null;
  };
  image?: {
    medium?: string;
    original?: string;
  };
  summary?: string | null;
  _links?: Record<string, unknown>;
}

export interface TvmazePayload {
  show_query: string;
  retrieved_at: string;
  show: Record<string, unknown>;
  episodes: TvmazeEpisode[];
}
