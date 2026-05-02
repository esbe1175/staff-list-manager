import { describe, expect, it } from 'vitest'
import { nameFromFilename } from '../lib/filenameParsing'

describe('nameFromFilename', () => {
  it('keeps Danish characters and hyphenated names', () => {
    expect(nameFromFilename('Jens Jørgen-Henriksen.png')).toBe('Jens Jørgen-Henriksen')
  })

  it('handles multiple dots', () => {
    expect(nameFromFilename('Anne.Mette.Jensen.profile.jpg')).toBe('Anne.Mette.Jensen.profile')
  })

  it('normalizes underscores and duplicate whitespace', () => {
    expect(nameFromFilename('Maja__Sørensen  (2).webp')).toBe('Maja Sørensen')
  })
})
