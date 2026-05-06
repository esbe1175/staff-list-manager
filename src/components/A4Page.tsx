import { memo, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { t } from '../i18n/translations'
import { autoSubtitle } from '../lib/date'
import { A4_LAYOUT } from '../lib/layoutConstants'
import { getCompactLayoutMetrics } from '../lib/pagination'
import type { PrintPage } from '../lib/pagination'
import type { StaffDocument, StaffMember } from '../types/document'

const seenStaffImageIds = new Set<string>()

type A4PageProps = {
  document: StaffDocument
  forceImages?: boolean
  page: PrintPage
  pageCount: number
  scale?: number
}

const StaffCard = memo(function StaffCard({
  forceImages = false,
  locale,
  showContact,
  staff,
}: {
  forceImages?: boolean
  locale: StaffDocument['locale']
  showContact: boolean
  staff: StaffMember
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [shouldAttachImage, setShouldAttachImage] = useState(() =>
    forceImages || seenStaffImageIds.has(staff.id),
  )
  const imageIsAttached = forceImages || shouldAttachImage

  useEffect(() => {
    if (forceImages) {
      seenStaffImageIds.add(staff.id)
      return
    }

    if (!staff.imageDataUrl || shouldAttachImage) {
      return
    }

    const frame = frameRef.current

    if (!frame) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          seenStaffImageIds.add(staff.id)
          setShouldAttachImage(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )

    observer.observe(frame)

    return () => observer.disconnect()
  }, [forceImages, shouldAttachImage, staff.id, staff.imageDataUrl])

  const effectiveJobTitle =
    staff.jobTitle.trim() || (staff.isPraktikant ? t(locale, 'praktikant') : '')

  return (
    <article className="staff-card">
      <div
        className={`staff-image-frame ${staff.isPraktikant ? 'is-praktikant' : ''}`}
        ref={frameRef}
      >
        {imageIsAttached && staff.imageDataUrl ? (
          <img alt="" decoding="async" height="500" src={staff.imageDataUrl} width="400" />
        ) : (
          <div className="staff-image-placeholder">{staff.name.slice(0, 1)}</div>
        )}
      </div>
      <strong>{staff.name}</strong>
      <span className={`staff-job-title ${staff.isPraktikant ? 'is-praktikant-title' : ''}`}>
        {effectiveJobTitle}
      </span>
      {showContact && (staff.email || staff.phone) ? (
        <small className="staff-contact">
          {staff.email ? <span>{staff.email}</span> : null}
          {staff.phone ? <span>{staff.phone}</span> : null}
        </small>
      ) : null}
    </article>
  )
})

export function A4Page({
  document,
  forceImages = false,
  page,
  pageCount,
  scale = 1,
}: A4PageProps) {
  const subtitle = document.useAutoDateSubtitle ? autoSubtitle(document.locale) : document.subtitle
  const compactMetrics = document.compactLayout ? getCompactLayoutMetrics(document) : null
  const showContact =
    !document.compactLayout || (compactMetrics?.cardHeightMm ?? A4_LAYOUT.staffCardHeightMm) >= 30

  return (
    <section
      className={`a4-page ${document.compactLayout ? 'is-compact-layout' : ''}`}
      style={{
        width: `${A4_LAYOUT.pageWidthMm}mm`,
        height: `${A4_LAYOUT.pageHeightMm}mm`,
        padding: `${A4_LAYOUT.marginMm}mm`,
        transform: `scale(${scale})`,
        '--document-primary-color': document.primaryColor,
        ...(compactMetrics
          ? {
              '--card-gap-mm': `${compactMetrics.cardGapMm}mm`,
              '--card-height-mm': `${compactMetrics.cardHeightMm}mm`,
              '--card-width-mm': `${compactMetrics.cardWidthMm}mm`,
              '--image-height-mm': `${compactMetrics.imageHeightMm}mm`,
              '--image-width-mm': `${compactMetrics.imageWidthMm}mm`,
              '--row-gap-mm': `${compactMetrics.rowGapMm}mm`,
              '--section-gap-mm': `${compactMetrics.sectionGapMm}mm`,
              '--section-header-height-mm': `${compactMetrics.sectionHeaderHeightMm}mm`,
              '--staff-columns': compactMetrics.perRow,
            }
          : {}),
      } as CSSProperties}
    >
      <header className="a4-header">
        <h1>{document.title}</h1>
        <p>{subtitle}</p>
      </header>

      <main className="a4-body">
        {page.sections.map((section) => (
          <section className="print-section" key={section.id}>
            <h2>
              {section.name}
              {section.continued ? ` (${t(document.locale, 'continued')})` : ''}
            </h2>
            {section.rows.map((row, rowIndex) => (
              <div className="staff-row" key={`${section.id}-${rowIndex}`}>
                {row.map((staff) => (
                  <StaffCard
                    forceImages={forceImages}
                    key={staff.id}
                    locale={document.locale}
                    showContact={showContact}
                    staff={staff}
                  />
                ))}
              </div>
            ))}
          </section>
        ))}
      </main>

      <footer className="a4-footer">
        <div className="legend">
          <span className="legend-box" />
          {t(document.locale, 'legend')}
        </div>
        <span>
          Side {page.pageNumber} af {pageCount}
        </span>
      </footer>
    </section>
  )
}
