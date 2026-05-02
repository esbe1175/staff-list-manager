export const A4_LAYOUT = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginMm: 14,
  headerHeightMm: 32,
  footerHeightMm: 12,
  sectionHeaderHeightMm: 14,
  sectionGapMm: 10,
  rowGapMm: 5,
  cardGapMm: 4,
  staffCardWidthMm: 27,
  staffCardHeightMm: 37,
  staffImageHeightMm: 25,
  legendHeightMm: 8,
} as const

export const contentWidthMm =
  A4_LAYOUT.pageWidthMm - A4_LAYOUT.marginMm * 2

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
