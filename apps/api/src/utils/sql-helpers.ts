/**
 * Escapes ILIKE special characters (% and _) in user input.
 * PostgreSQL ILIKE treats % as "any sequence" and _ as "any single character".
 * Without escaping, user input like "%" would match all rows.
 *
 * The backslash is the default escape character in PostgreSQL ILIKE.
 */
export function escapeLike(input: string): string {
  return input
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')     // Escape %
    .replace(/_/g, '\\_');     // Escape _
}

/**
 * Wraps escaped input in % wildcards for "contains" search.
 * Usage: ilike(column, likeContains(userInput))
 */
export function likeContains(input: string): string {
  return `%${escapeLike(input)}%`;
}
