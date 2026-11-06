import { firstName } from './template'

/*
 * An invitation is for one person or a couple (a second name).
 */

/** Greeting names: "Ama", or "Kingsley and Vanessa" with `and` = "and" / "et". */
export function shortNames(
  name: string,
  partnerName: string | null | undefined,
  and: string,
): string {
  const first = firstName(name)
  return partnerName ? `${first} ${and} ${firstName(partnerName)}` : first
}

/** Studio and ticket names: "Ama Ngono", or "Kingsley Ngu & Vanessa Ngu". */
export function fullNames(name: string, partnerName: string | null | undefined): string {
  return partnerName ? `${name.trim()} & ${partnerName.trim()}` : name.trim()
}

/** How many seats an invitation takes. */
export function seatsFor(partnerName: string | null | undefined): 1 | 2 {
  return partnerName ? 2 : 1
}
