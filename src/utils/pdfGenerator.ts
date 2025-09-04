import { StaffData } from '../types'

export const generatePDF = async (_staffData: StaffData) => {
  try {
    console.log('Starting native print to PDF...')
    
    // Create a simple print-optimized CSS
    const printStyles = `
      @media print {
        @page { 
          margin: 0; 
          size: A4;
          /* Remove headers and footers */
        }
        
        body * { visibility: hidden; }
        #print-preview, #print-preview * { visibility: visible; }
        #print-preview { position: absolute; left: 0; top: 0; width: 100%; }
        .space-y-8 > * + * { margin-top: 0 !important; }
        .space-y-8 { display: block !important; }
      }
    `
    
    // Inject print styles
    const styleElement = document.createElement('style')
    styleElement.textContent = printStyles
    document.head.appendChild(styleElement)

    // Wait a moment for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100))

    // Trigger native print dialog
    window.print()

    // Clean up styles after a delay
    setTimeout(() => {
      document.head.removeChild(styleElement)
    }, 1000)

    console.log('Print dialog opened successfully!')
  } catch (error) {
    console.error('Error opening print dialog:', error)
    alert(`Error opening print dialog: ${error instanceof Error ? error.message : String(error)}`)
  }
}