import type { Locale } from '../types/document'

export function autoSubtitle(locale: Locale, date = new Date()): string {
  const formatter = new Intl.DateTimeFormat(locale === 'da' ? 'da-DK' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })
  const formatted = formatter.format(date)
  const monthYear = formatted.charAt(0).toUpperCase() + formatted.slice(1)

  return locale === 'da' ? `Personaleoversigt – ${monthYear}` : `Staff List – ${monthYear}`
}
