import React, { useState, useRef, useEffect } from 'react'
import { Edit3 } from 'lucide-react'
import { cn } from '../utils/cn'

interface EditableTitleProps {
  title: string
  onTitleChange: (newTitle: string) => void
}

const EditableTitle: React.FC<EditableTitleProps> = ({ title, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempTitle(title)
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setIsEditing(true)
    setTempTitle(title)
  }

  const handleSave = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempTitle(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-3xl font-bold text-gray-800 bg-white border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={50}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-3 mb-4 cursor-pointer group',
        'hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors'
      )}
      onClick={handleStartEdit}
    >
      <h1 className="text-3xl font-bold text-gray-800">
        {title}
      </h1>
      <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </div>
  )
}

export default EditableTitle