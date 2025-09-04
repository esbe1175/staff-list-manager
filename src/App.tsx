import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import StaffCard from './components/StaffCard'
import DropZone from './components/DropZone'
import EditableTitle from './components/EditableTitle'
import { StaffMember, StaffData } from './types'
import { Download } from 'lucide-react'
import { generatePDF } from './utils/pdfGenerator'

function App() {
  const [staffData, setStaffData] = useState<StaffData>({
    title: 'Vores Team',
    sections: [
      { title: 'Administrationen', members: [] },
      { title: 'Sygeplejersker', members: [] }
    ]
  })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const loadMembersFromDirectory = useCallback(async (sectionIndex: number, directoryPath: string) => {
    try {
      const members: StaffMember[] = await invoke('read_staff_images', {
        directory: directoryPath
      })

      setStaffData(prev => ({
        ...prev,
        sections: prev.sections.map((section, index) =>
          index === sectionIndex
            ? { ...section, members }
            : section
        )
      }))
    } catch (error) {
      console.error('Error loading images from directory:', error)
    }
  }, [])

  const handleDirectorySelect = async (sectionIndex: number) => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: `Vælg mappe for ${staffData.sections[sectionIndex].title}`
      })

      if (selected && typeof selected === 'string') {
        await loadMembersFromDirectory(sectionIndex, selected)
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    }
  }

  const handleFileSelect = async (sectionIndex: number) => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Images',
            extensions: ['jpg', 'jpeg', 'png']
          }
        ],
        title: `Vælg billeder for ${staffData.sections[sectionIndex].title}`
      })

      if (selected) {
        let filePath: string
        
        if (Array.isArray(selected) && selected.length > 0) {
          // Multiple files selected - use first file's path
          filePath = selected[0]
        } else if (typeof selected === 'string') {
          // Single file selected
          filePath = selected
        } else {
          return
        }
        
        // Extract directory from file path
        const directoryPath = filePath.substring(0, filePath.lastIndexOf('\\')) || 
                            filePath.substring(0, filePath.lastIndexOf('/'))
        
        if (directoryPath) {
          await loadMembersFromDirectory(sectionIndex, directoryPath)
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error)
    }
  }

  const toggleIntern = useCallback((sectionIndex: number, memberIndex: number) => {
    setStaffData(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              members: section.members.map((member, mIndex) =>
                mIndex === memberIndex
                  ? { ...member, is_intern: !member.is_intern }
                  : member
              )
            }
          : section
      )
    }))
  }, [])

  const deleteMember = useCallback((sectionIndex: number, memberIndex: number) => {
    setStaffData(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              members: section.members.filter((_, mIndex) => mIndex !== memberIndex)
            }
          : section
      )
    }))
  }, [])

  const updateTitle = useCallback((newTitle: string) => {
    setStaffData(prev => ({ ...prev, title: newTitle }))
  }, [])

  const handleSaveForPrinting = async () => {
    setIsGeneratingPDF(true)
    try {
      await generatePDF(staffData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const calculateCardSize = (totalMembers: number) => {
    if (totalMembers <= 12) return 'large'
    if (totalMembers <= 24) return 'medium'
    return 'small'
  }

  const totalMembers = staffData.sections.reduce((acc, section) => acc + section.members.length, 0)
  const cardSize = calculateCardSize(totalMembers)

  // Calculate pagination for print preview
  const calculatePages = () => {
    const A4_HEIGHT = 297 // mm
    const MARGIN = 24 // mm (1.5rem * 16px/rem * 0.0625mm/px * 2)
    const AVAILABLE_HEIGHT = A4_HEIGHT - MARGIN
    
    // Approximate heights in mm (rough conversion from rem/px to mm)
    const TITLE_HEIGHT = 15 // text-2xl + mb-4
    const SECTION_HEADER_HEIGHT = 12 // text-xl + mb-3 + border
    
    const gridCols = cardSize === 'large' ? 4 : cardSize === 'medium' ? 5 : 6
    const CARD_WIDTH = (210 - MARGIN - ((gridCols - 1) * 3)) / gridCols // 3mm gap
    const CARD_HEIGHT = CARD_WIDTH * (4/3) + (cardSize === 'large' ? 15 : cardSize === 'medium' ? 12 : 10)
    
    const pages: Array<{ title: string; sections: Array<{ title: string; members: StaffMember[] }> }> = []
    let currentPageHeight = TITLE_HEIGHT + 8
    let currentPageData: StaffData = { title: staffData.title, sections: [] }
    let isFirstPage = true

    for (const section of staffData.sections) {
      if (section.members.length === 0) continue

      let sectionMembersRemaining = [...section.members]

      while (sectionMembersRemaining.length > 0) {
        const sectionHeaderNeeded = !currentPageData.sections.find(s => s.title === section.title)
        const sectionHeaderHeight = sectionHeaderNeeded ? SECTION_HEADER_HEIGHT : 0

        // Calculate how many cards can fit on current page
        const remainingHeight = AVAILABLE_HEIGHT - currentPageHeight - sectionHeaderHeight - 4
        const rowsAvailable = Math.floor(remainingHeight / (CARD_HEIGHT + 3))
        const cardsCanFit = Math.max(0, rowsAvailable * gridCols)

        if (cardsCanFit === 0) {
          // Current page is full, save it and start new page
          if (currentPageData.sections.some(s => s.members.length > 0)) {
            pages.push(JSON.parse(JSON.stringify(currentPageData)))
          }

          // Reset for new page
          currentPageData = { title: staffData.title, sections: [] }
          currentPageHeight = isFirstPage ? TITLE_HEIGHT + 8 : 4
          isFirstPage = false
          continue
        }

        // Take cards that fit on current page
        const cardsForThisPage = sectionMembersRemaining.splice(0, Math.min(cardsCanFit, sectionMembersRemaining.length))

        // Add to current page data
        const existingSection = currentPageData.sections.find(s => s.title === section.title)
        if (existingSection) {
          existingSection.members.push(...cardsForThisPage)
        } else {
          currentPageData.sections.push({
            title: section.title,
            members: cardsForThisPage
          })
        }

        // Update current page height
        const rowsUsed = Math.ceil(cardsForThisPage.length / gridCols)
        currentPageHeight += sectionHeaderHeight + (rowsUsed * (CARD_HEIGHT + 3)) + 4
      }
    }

    // Add final page if it has content
    if (currentPageData.sections.some(s => s.members.length > 0)) {
      pages.push(JSON.parse(JSON.stringify(currentPageData)))
    }

    return pages.length > 0 ? pages : [{ title: staffData.title, sections: [] }]
  }

  const pages = calculatePages()


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <EditableTitle title={staffData.title} onTitleChange={updateTitle} />
          <button
            onClick={handleSaveForPrinting}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={totalMembers === 0 || isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Genererer PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Gem til udskrift
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {staffData.sections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
              
              {section.members.length === 0 ? (
                <DropZone
                  onDirectorySelect={() => handleDirectorySelect(sectionIndex)}
                  onFileSelect={() => handleFileSelect(sectionIndex)}
                  sectionTitle={section.title}
                />
              ) : (
                <div 
                  className={`grid gap-2 ${
                    cardSize === 'large' ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' :
                    cardSize === 'medium' ? 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6' :
                    'grid-cols-5 sm:grid-cols-6 lg:grid-cols-8'
                  } relative`}
                >
                  {section.members.map((member, memberIndex) => (
                    <StaffCard
                      key={`${member.name}-${memberIndex}`}
                      member={member}
                      size={cardSize}
                      onClick={() => toggleIntern(sectionIndex, memberIndex)}
                      onDelete={() => deleteMember(sectionIndex, memberIndex)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalMembers > 0 && (
          <div id="print-preview" className="space-y-8">
            {pages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white p-6 rounded-lg shadow-lg print:shadow-none print:p-4 relative"
                style={{ 
                  width: '21cm',
                  height: '29.7cm',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                  pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto'
                }}
              >
                {/* Title only on first page */}
                {pageIndex === 0 && (
                  <h1 className="text-2xl font-bold text-center mb-4 text-gray-800 leading-none">
                    {staffData.title}
                  </h1>
                )}
                
                {page.sections.map((section) => (
                  section.members.length > 0 && (
                    <div key={`${section.title}-page-${pageIndex}`} className="mb-4 last:mb-0">
                      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b border-gray-300 pb-2 leading-none">
                        {section.title}
                      </h2>
                      <div className={`grid gap-3 ${
                        cardSize === 'large' ? 'grid-cols-4' :
                        cardSize === 'medium' ? 'grid-cols-5' :
                        'grid-cols-6'
                      }`}>
                        {section.members.map((member, index) => (
                          <StaffCard
                            key={`${member.name}-print-${pageIndex}-${index}`}
                            member={member}
                            size={cardSize}
                            printMode
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Legend at bottom left */}
                <div className="absolute bottom-4 left-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    <span>= Praktikant</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App