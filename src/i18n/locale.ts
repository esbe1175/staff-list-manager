import type { Locale } from '../types/document'

export function detectSystemLocale(languages: readonly string[] = navigator.languages): Locale {
  const candidates = languages.length > 0 ? languages : [navigator.language]

  return candidates.some((language) => language.toLowerCase().startsWith('da')) ? 'da' : 'en'
}
