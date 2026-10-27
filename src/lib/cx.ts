/** Joins class names, skipping false/undefined: cx('a', isOn && 'b') → 'a b' */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}
