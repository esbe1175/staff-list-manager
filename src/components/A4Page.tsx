import { memo, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { t } from '../i18n/translations'
import { autoSubtitle } from '../lib/date'
import { A4_LAYOUT } from '../lib/layoutConstants'
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
  staff,
}: {
  forceImages?: boolean
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

  return (
    <article className="staff-card">
      <div
        className={`staff-image-frame ${staff.isPraktikant ? 'is-praktikant' : ''}`}
        ref={frameRef}
      >
        {imageIsAttached && staff.imageDataUrl ? (
          <img alt="" decoding="async" height="512" src={staff.imageDataUrl} width="512" />
        ) : (
          <div className="staff-image-placeholder">{staff.name.slice(0, 1)}</div>
        )}
      </div>
      <strong>{staff.name}</strong>
      <span>{staff.jobTitle}</span>
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

  return (
    <section
      className="a4-page"
      style={{
        width: `${A4_LAYOUT.pageWidthMm}mm`,
        height: `${A4_LAYOUT.pageHeightMm}mm`,
        padding: `${A4_LAYOUT.marginMm}mm`,
        transform: `scale(${scale})`,
        '--document-primary-color': document.primaryColor,
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
                  <StaffCard forceImages={forceImages} staff={staff} key={staff.id} />
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
