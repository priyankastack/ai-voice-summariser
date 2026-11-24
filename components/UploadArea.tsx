// 'use client'

// import { useRef, useState } from 'react'
// import { Upload } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'

// interface UploadAreaProps {
//   onFileUpload: (file: File) => void
// }

// export default function UploadArea({ onFileUpload }: UploadAreaProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [isDragging, setIsDragging] = useState(false)

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     setIsDragging(true)
//   }

//   const handleDragLeave = () => {
//     setIsDragging(false)
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     setIsDragging(false)

//     const files = e.dataTransfer.files
//     if (files && files.length > 0) {
//       const file = files[0]
//       if (file.type.startsWith('audio/')) {
//         onFileUpload(file)
//       }
//     }
//   }

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files
//     if (files && files.length > 0) {
//       onFileUpload(files[0])
//     }
//   }

//   const handleClick = () => {
//     fileInputRef.current?.click()
//   }

//   return (
//     <Card
//       className={`border-2 border-dashed transition-all ${
//         isDragging
//           ? 'border-primary bg-primary/5'
//           : 'border-border bg-card hover:border-primary/50'
//       }`}
//       onDragOver={handleDragOver}
//       onDragLeave={handleDragLeave}
//       onDrop={handleDrop}
//     >
//       <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 sm:px-12 sm:py-16">
//         <div className="rounded-lg bg-secondary p-4">
//           <Upload className="h-8 w-8 text-primary" />
//         </div>

//         <div className="space-y-2 text-center">
//           <h3 className="text-xl font-semibold text-foreground">
//             Drag & drop your audio file here
//           </h3>
//           <p className="text-muted-foreground">
//             or click the button below to select a file
//           </p>
//         </div>

//         <Button
//           onClick={handleClick}
//           size="lg"
//           className="px-8"
//         >
//           Choose File (MP3, WAV)
//         </Button>

//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="audio/mp3,audio/wav,audio/*"
//           onChange={handleFileSelect}
//           className="hidden"
//         />

//         <p className="text-xs text-muted-foreground">
//           Supported formats: MP3, WAV, and other audio formats (Max 100MB)
//         </p>
//       </div>
//     </Card>
//   )
// }


'use client'

import { useRef, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UploadAreaProps {
  onFileUpload: (file: File) => void
}

const MAX_SIZE_MB = 25

export default function UploadArea({ onFileUpload }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3, WAV, M4A, etc.).')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }

    setError(null)
    onFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      validateAndUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndUpload(files[0])
    }
    // Same file dobara select karne par bhi onChange chale
    e.target.value = ''
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'scale-[1.01] border-primary bg-primary/10 shadow-lg'
            : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 sm:px-12 sm:py-16">
          <div
            className={`rounded-full p-4 transition-all duration-200 ${
              isDragging ? 'scale-110 bg-primary/20' : 'bg-secondary'
            }`}
          >
            <Upload
              className={`h-8 w-8 text-primary ${isDragging ? 'animate-bounce' : ''}`}
            />
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragging ? 'Drop your file here' : 'Drag & drop your audio file here'}
            </h3>
            <p className="text-muted-foreground">
              or click the button below to select a file
            </p>
          </div>

          <Button onClick={handleClick} size="lg" className="px-8">
            Choose File (MP3, WAV)
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-xs text-muted-foreground">
            Supported formats: MP3, WAV, and other audio formats (Max {MAX_SIZE_MB}MB)
          </p>
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}