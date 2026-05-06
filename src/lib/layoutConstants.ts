export const A4_LAYOUT = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginMm: 14,
  compactMarginMm: 8,
  headerHeightMm: 32,
  footerHeightMm: 12,
  sectionHeaderHeightMm: 14,
  compactHeaderHeightMm: 12,
  compactSectionHeaderHeightMm: 5,
  sectionGapMm: 10,
  compactSectionGapMm: 2,
  rowGapMm: 5,
  compactRowGapMm: 1.2,
  cardGapMm: 4,
  compactCardGapMm: 1.4,
  staffCardWidthMm: 27,
  staffCardHeightMm: 42,
  staffImageWidthMm: 24,
  staffImageHeightMm: 30,
  legendHeightMm: 4,
} as const

export const contentWidthMm =
  A4_LAYOUT.pageWidthMm - A4_LAYOUT.marginMm * 2

export function getContentWidthMm(compactLayout: boolean): number {
  const marginMm = compactLayout ? A4_LAYOUT.compactMarginMm : A4_LAYOUT.marginMm

  return A4_LAYOUT.pageWidthMm - marginMm * 2
}

export const availableBodyHeightMm =
  A4_LAYOUT.pageHeightMm -
  A4_LAYOUT.marginMm * 2 -
  A4_LAYOUT.headerHeightMm -
  A4_LAYOUT.footerHeightMm -
  A4_LAYOUT.legendHeightMm

export const staffPerRow = Math.max(
  1,
  Math.floor(
    (contentWidthMm + A4_LAYOUT.cardGapMm) /
      (A4_LAYOUT.staffCardWidthMm + A4_LAYOUT.cardGapMm),
  ),
)

export function getAvailableBodyHeightMm(compactLayout: boolean): number {
  return (
    A4_LAYOUT.pageHeightMm -
    (compactLayout ? A4_LAYOUT.compactMarginMm : A4_LAYOUT.marginMm) * 2 -
    (compactLayout ? A4_LAYOUT.compactHeaderHeightMm : A4_LAYOUT.headerHeightMm) -
    A4_LAYOUT.footerHeightMm -
    A4_LAYOUT.legendHeightMm
  )
}
