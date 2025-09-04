import React from 'react'
import { Upload, FolderOpen } from 'lucide-react'

interface DropZoneProps {
  onDirectorySelect: () => void
  onFileSelect?: () => void
  sectionTitle: string
}

const DropZone: React.FC<DropZoneProps> = ({ onDirectorySelect, onFileSelect, sectionTitle }) => {
  return (
    <div
      className="border-2 border-dashed rounded-lg p-12 text-center transition-colors border-gray-300 hover:border-gray-400 hover:bg-gray-50"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <FolderOpen className="w-8 h-8 text-gray-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tilføj billeder til {sectionTitle}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Vælg en mappe eller individuelle billeder
          </p>
          <p className="text-gray-400 text-xs">
            Understøttede formater: JPG, JPEG, PNG
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDirectorySelect}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Vælg mappe</span>
          </button>
          {onFileSelect && (
            <button
              onClick={onFileSelect}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Vælg billeder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DropZone