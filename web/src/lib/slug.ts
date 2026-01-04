import { stripWrappingQuotes } from "./text";

export function slugify(input: string): string {
  const cleaned = stripWrappingQuotes(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "untitled";
}
