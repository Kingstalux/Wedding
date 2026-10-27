/**
 * Web addresses aren't allowed in guest messages (guest book, gift notes),
 * which keeps spam links off the site. The database applies the same rule.
 */
export const LINK_PATTERN =
  /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|cm|fr|io|me|ly|app|co)\b/i

export function containsLink(text: string): boolean {
  return LINK_PATTERN.test(text)
}
