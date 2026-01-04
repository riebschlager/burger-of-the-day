export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

export function stripWrappingQuotes(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length >= 2 && trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function toSentenceCase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  return lower[0].toUpperCase() + lower.slice(1);
}
