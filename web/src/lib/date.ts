export function formatEpisodeCode(season: number, number: number | null | undefined): string {
  const seasonPart = String(season).padStart(2, "0");
  const numberPart = String(number ?? 0).padStart(2, "0");
  return `s${seasonPart}e${numberPart}`;
}

export function parseAirdate(airdate?: string | null): Date | null {
  if (!airdate) return null;
  const parsed = new Date(airdate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatAirdate(airdate?: string | null): string {
  const parsed = parseAirdate(airdate);
  if (!parsed) return "Unknown";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isWithinWeekOfToday(airdate: Date, now = new Date()): boolean {
  const candidates = [
    new Date(now.getFullYear() - 1, airdate.getMonth(), airdate.getDate()),
    new Date(now.getFullYear(), airdate.getMonth(), airdate.getDate()),
    new Date(now.getFullYear() + 1, airdate.getMonth(), airdate.getDate()),
  ];

  const dayMs = 1000 * 60 * 60 * 24;
  const diffs = candidates.map((candidate) =>
    Math.abs(candidate.getTime() - now.getTime()) / dayMs
  );

  return Math.min(...diffs) <= 3.5;
}
