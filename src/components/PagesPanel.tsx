import { t } from '../i18n/translations'
import { autoSubtitle } from '../lib/date'
import type { CSSProperties } from 'react'
import type { PrintPage } from '../lib/pagination'
import type { StaffDocument } from '../types/document'

type PagesPanelProps = {
  document: StaffDocument
  pages: PrintPage[]
  selectedPageNumber: number
  onPageSelect: (pageNumber: number) => void
}

export function PagesPanel({ document, pages, selectedPageNumber, onPageSelect }: PagesPanelProps) {
  const subtitle = document.useAutoDateSubtitle ? autoSubtitle(document.locale) : document.subtitle

  return (
    <aside className="pages-panel">
      <h2>{t(document.locale, 'pages')}</h2>
      <div className="page-thumbnails">
        {pages.map((page) => (
          <button
            aria-current={page.pageNumber === selectedPageNumber ? 'page' : undefined}
            className={`thumbnail-wrap ${page.pageNumber === selectedPageNumber ? 'selected' : ''}`}
            key={page.pageNumber}
            type="button"
            onClick={() => onPageSelect(page.pageNumber)}
          >
            <div
              className="thumbnail-page-frame"
              style={{ '--document-primary-color': document.primaryColor } as CSSProperties}
            >
              <div className="thumbnail-header">
                <strong>{document.title}</strong>
                <small>{subtitle}</small>
              </div>
              <div className="thumbnail-sections">
                {page.sections.slice(0, 5).map((section) => (
                  <div className="thumbnail-section" key={section.id}>
                    <span>{section.name}</span>
                    <div className="thumbnail-row-stack">
                      {section.rows.slice(0, 3).map((row, rowIndex) => (
                        <div className="thumbnail-staff-dots" key={`${section.id}-${rowIndex}`}>
                          {row.map((staff) => (
                          <i
                            className={staff.isPraktikant ? 'is-praktikant' : ''}
                            key={staff.id}
                          />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="thumbnail-footer" />
            </div>
            <span>{page.pageNumber}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
