import React, { useState, useEffect, useRef } from 'react'
import { StaffMember } from '../types'
import { cn } from '../utils/cn'
import { invoke } from '@tauri-apps/api/core'
import { imageCache } from '../utils/imageCache'

interface StaffCardProps {
  member: StaffMember
  size: 'small' | 'medium' | 'large'
  onClick?: () => void
  onDelete?: () => void
  printMode?: boolean
}

const StaffCard: React.FC<StaffCardProps> = ({ member, size, onClick, onDelete, printMode = false }) => {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(printMode) // Load immediately in print mode
  const cardRef = useRef<HTMLDivElement>(null)
  
  const sizeClasses = {
    small: 'w-full max-w-28', // Responsive width, max 112px  
    medium: 'w-full max-w-36', // Responsive width, max 144px
    large: 'w-full max-w-44'   // Responsive width, max 176px
  }

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (printMode) return // Skip lazy loading in print mode

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '50px' } // Load when element is 50px away from viewport
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [printMode])

  useEffect(() => {
    if (!isVisible) return

    const loadImage = async () => {
      try {
        setLoading(true)
        
        // Check cache first
        if (imageCache.has(member.image_path)) {
          const cachedData = imageCache.get(member.image_path)!
          setImageSrc(cachedData)
          setLoading(false)
          return
        }

        const dataUrl: string = await invoke('get_image_data', { imagePath: member.image_path })
        
        // Cache the result
        imageCache.set(member.image_path, dataUrl)
        setImageSrc(dataUrl)
      } catch (error) {
        console.error('Error loading image:', error)
        setImageSrc('')
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [member.image_path, isVisible])

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-white rounded-lg overflow-hidden transition-all duration-200 group relative',
        'border border-gray-300',
        member.is_intern && 'border-2 border-blue-500',
        sizeClasses[size],
        !printMode && 'cursor-pointer hover:shadow-lg hover:scale-105'
      )}
      onClick={!printMode ? onClick : undefined}
    >
      <div className="flex flex-col">
        {/* Image container with 3:4 aspect ratio */}
        <div className="relative w-full aspect-[3/4]">
          {!isVisible ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ) : loading ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={member.name}
              className="w-full h-full object-cover"
              style={{ 
                aspectRatio: '3/4',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Billede ikke tilgængelig</span>
              </div>
            </div>
          )}
          
          {/* Delete button - only show when not in print mode */}
          {!printMode && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100"
              title="Slet medlem"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {/* Text section - compact but readable */}
        <div className={cn('flex flex-col justify-center', size === 'large' ? 'p-4' : size === 'medium' ? 'p-3' : 'p-2')}>
          <h3 className={cn(
            'font-semibold text-gray-800 leading-none text-center m-0',
            textSizeClasses[size]
          )} style={{ marginTop: 0, marginBottom: member.job_title ? '0.25rem' : 0 }}>
            {member.name}
          </h3>
          {member.job_title && (
            <p className={cn(
              'text-gray-600 leading-none text-center m-0',
              size === 'small' ? 'text-xs' : size === 'medium' ? 'text-xs' : 'text-sm'
            )} style={{ marginTop: 0, marginBottom: 0 }}>
              {member.job_title}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffCard