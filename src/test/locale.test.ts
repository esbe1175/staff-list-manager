import { describe, expect, it } from 'vitest'
import { detectSystemLocale } from '../i18n/locale'

describe('detectSystemLocale', () => {
  it('uses Danish when any browser language is Danish', () => {
    expect(detectSystemLocale(['en-US', 'da-DK'])).toBe('da')
  })

  it('falls back to English for non-Danish browsers', () => {
    expect(detectSystemLocale(['de-DE', 'en-US'])).toBe('en')
  })
})
