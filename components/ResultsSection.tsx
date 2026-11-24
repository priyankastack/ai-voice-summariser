// import { Card } from '@/components/ui/card'
// import { CheckCircle2, FileText } from 'lucide-react'

// interface ResultsSectionProps {
//   results: {
//     transcript: string
//     summary: string[]
//   }
// }

// export default function ResultsSection({ results }: ResultsSectionProps) {
//   return (
//     <div className="grid gap-8 md:grid-cols-2">
//       {/* Transcript Card */}
//       <Card className="border border-border bg-card">
//         <div className="space-y-4 p-6 sm:p-8">
//           <div className="flex items-center gap-3">
//             <div className="rounded-lg bg-primary/10 p-2">
//               <FileText className="h-5 w-5 text-primary" />
//             </div>
//             <h3 className="text-xl font-semibold text-foreground">Transcript</h3>
//           </div>

//           <div className="border-t border-border pt-4">
//             <p className="leading-relaxed text-foreground/90">
//               {results.transcript}
//             </p>
//           </div>
//         </div>
//       </Card>

//       {/* Summary Card */}
//       <Card className="border border-border bg-card">
//         <div className="space-y-4 p-6 sm:p-8">
//           <div className="flex items-center gap-3">
//             <div className="rounded-lg bg-accent/10 p-2">
//               <CheckCircle2 className="h-5 w-5 text-accent" />
//             </div>
//             <h3 className="text-xl font-semibold text-foreground">Summary</h3>
//           </div>

//           <div className="border-t border-border pt-4">
//             <ul className="space-y-3">
//               {results.summary.map((point, index) => (
//                 <li key={index} className="flex gap-3">
//                   <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
//                     {index + 1}
//                   </span>
//                   <span className="text-foreground/90">{point}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </Card>
//     </div>
//   )
// }


'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FileText, Copy, Check, Download, MicOff } from 'lucide-react'

interface ResultsSectionProps {
  results: {
    transcript: string
    summary: string[]
  }
}

export default function ResultsSection({ results }: ResultsSectionProps) {
  const [copied, setCopied] = useState<'transcript' | 'summary' | null>(null)

  const hasTranscript = results.transcript && results.transcript.trim().length > 0

  const handleCopy = async (type: 'transcript' | 'summary') => {
    const text =
      type === 'transcript'
        ? results.transcript
        : results.summary.map((p, i) => `${i + 1}. ${p}`).join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleDownload = () => {
    const content = `TRANSCRIPT\n==========\n${results.transcript}\n\nSUMMARY\n=======\n${results.summary
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n')}\n`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'voice-note-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download .txt
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transcript Card */}
        <Card className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Transcript</h3>
              </div>

              {hasTranscript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy('transcript')}
                  className="gap-2"
                >
                  {copied === 'transcript' ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="border-t border-border pt-4">
              {hasTranscript ? (
                <div className="max-h-96 overflow-y-auto pr-2">
                  <p
                    dir="auto"
                    className="whitespace-pre-line leading-relaxed text-foreground/90"
                  >
                    {results.transcript}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <MicOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No speech or lyrics detected. The audio may be instrumental.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Summary Card */}
        <Card className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Summary</h3>
              </div>

              {results.summary.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy('summary')}
                  className="gap-2"
                >
                  {copied === 'summary' ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="max-h-96 overflow-y-auto pr-2">
                <ul className="space-y-3">
                  {results.summary.map((point, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                      <span dir="auto" className="leading-relaxed text-foreground/90">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
