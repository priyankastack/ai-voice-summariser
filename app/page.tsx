// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import { Loader2, AlertCircle, Check } from 'lucide-react'
// import type { User } from '@supabase/supabase-js'
// import { Button } from '@/components/ui/button'
// import Header from '@/components/Header'
// import UploadArea from '@/components/UploadArea'
// import AudioPlayerPreview from '@/components/AudioPlayerPreview'
// import ResultsSection from '@/components/ResultsSection'
// import AuthBar from '@/components/AuthBar'
// import AuthModal from '@/components/AuthModal'
// import HistorySection, { type HistoryItem } from '@/components/HistorySection'
// import { supabase } from '@/lib/supabase'

// const LANGUAGES = [
//   { value: 'hi', label: 'Hindi' },
//   { value: 'en', label: 'English' },
//   { value: 'pa', label: 'Punjabi' },
//   { value: 'ur', label: 'Urdu' },
// ]

// const STEPS = ['Upload', 'Preview', 'Results']

// export default function Home() {
//   const [audioFile, setAudioFile] = useState<File | null>(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSlow, setIsSlow] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [language, setLanguage] = useState('hi')
//   const [results, setResults] = useState<{
//     transcript: string
//     summary: string[]
//   } | null>(null)

//   // Auth + history
//   const [user, setUser] = useState<User | null>(null)
//   const [showAuth, setShowAuth] = useState(false)
//   const [authMode, setAuthMode] = useState<'login' | 'reset'>('login')
//   const [showHistory, setShowHistory] = useState(false)
//   const [history, setHistory] = useState<HistoryItem[]>([])
//   const [historyLoading, setHistoryLoading] = useState(false)
//   const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

//   const userId = user?.id ?? null
//   const currentStep = results ? 3 : audioFile ? 2 : 1

//   // Render free tier pe server sleep se uthne me time lagta hai
//   useEffect(() => {
//     if (!isLoading) {
//       setIsSlow(false)
//       return
//     }
//     const timer = setTimeout(() => setIsSlow(true), 8000)
//     return () => clearTimeout(timer)
//   }, [isLoading])

//   // Login state track karo
//   useEffect(() => {
//     if (!supabase) return

//     supabase.auth.getSession().then(({ data }) => {
//       setUser(data.session?.user ?? null)
//     })

//     const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//       setUser(session?.user ?? null)

//       // Reset password email link se wapas aane par naya password set karne ka form kholo
//       if (event === 'PASSWORD_RECOVERY') {
//         setAuthMode('reset')
//         setShowAuth(true)
//       }
//     })

//     return () => listener.subscription.unsubscribe()
//   }, [])

//   const fetchHistory = useCallback(async () => {
//     if (!supabase) return
//     setHistoryLoading(true)

//     const { data, error } = await supabase
//       .from('summaries')
//       .select('id, filename, language, transcript, summary, created_at')
//       .order('created_at', { ascending: false })
//       .limit(50)

//     if (error) {
//       console.error('History fetch failed:', error.message)
//     } else {
//       setHistory((data as HistoryItem[]) ?? [])
//     }
//     setHistoryLoading(false)
//   }, [])

//   // Login hone par history load, logout par clear
//   useEffect(() => {
//     if (userId) {
//       fetchHistory()
//     } else {
//       setHistory([])
//       setShowHistory(false)
//     }
//   }, [userId, fetchHistory])

//   const saveToHistory = async (
//     file: File,
//     transcript: string,
//     summary: string[]
//   ) => {
//     // Guest ke liye kuch save nahi hota. Khali transcript (instrumental) bhi skip.
//     if (!supabase || !user || !transcript.trim()) return

//     const { data, error } = await supabase
//       .from('summaries')
//       .insert({
//         user_id: user.id,
//         filename: file.name,
//         language,
//         transcript,
//         summary,
//       })
//       .select('id, filename, language, transcript, summary, created_at')
//       .single()

//     if (error) {
//       console.error('Saving to history failed:', error.message)
//       return
//     }

//     setHistory((prev) => [data as HistoryItem, ...prev])
//     setActiveHistoryId((data as HistoryItem).id)
//   }

//   const handleDeleteHistory = async (id: string) => {
//     if (!supabase) return

//     const { error } = await supabase.from('summaries').delete().eq('id', id)
//     if (error) {
//       console.error('Delete failed:', error.message)
//       return
//     }

//     setHistory((prev) => prev.filter((item) => item.id !== id))
//     if (activeHistoryId === id) {
//       setResults(null)
//       setActiveHistoryId(null)
//     }
//   }

//   const handleSelectHistory = (item: HistoryItem) => {
//     setAudioFile(null)
//     setError(null)
//     setResults({ transcript: item.transcript, summary: item.summary })
//     setActiveHistoryId(item.id)
//     setShowHistory(false)
//     window.scrollTo({ top: 0, behavior: 'smooth' })
//   }

//   const handleLogout = async () => {
//     if (!supabase) return
//     await supabase.auth.signOut()
//     // Privacy: logout ke baad screen se saved data hata do
//     setResults(null)
//     setAudioFile(null)
//     setActiveHistoryId(null)
//     setShowHistory(false)
//   }

//   const handleFileUpload = (file: File) => {
//     setAudioFile(file)
//     setResults(null)
//     setError(null)
//     setActiveHistoryId(null)
//   }

//   const handleGenerateSummary = async () => {
//     if (!audioFile) return

//     setIsLoading(true)
//     setError(null)

//     try {
//       const formData = new FormData()
//       formData.append('file', audioFile)
//       formData.append('language', language)

//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-audio`,
//         {
//           method: 'POST',
//           body: formData,
//         }
//       )

//       if (!res.ok) {
//         throw new Error('Upload failed')
//       }

//       const data = await res.json()

//       const backendResults = {
//         transcript: data.transcript ?? '',
//         summary: data.summary || [
//           'Summary will come from backend after processing',
//         ],
//       }

//       setResults(backendResults)

//       // Logged in ho to history me save karo (fail ho jaye to bhi results dikhte rahenge)
//       await saveToHistory(audioFile, backendResults.transcript, backendResults.summary)
//     } catch (err) {
//       console.error(err)
//       setError('Something went wrong while processing your audio. Please try again.')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-4xl">
//         {/* Login / Logout / History bar (sirf tab jab Supabase env set ho) */}
//         {supabase && (
//           <div className="mb-6">
//             <AuthBar
//               user={user}
//               showHistory={showHistory}
//               onLoginClick={() => {
//                 setAuthMode('login')
//                 setShowAuth(true)
//               }}
//               onLogout={handleLogout}
//               onToggleHistory={() => setShowHistory((prev) => !prev)}
//             />
//           </div>
//         )}

//         <Header />

//         {/* Step Indicator */}
//         <div className="mt-10 flex items-center justify-center">
//           {STEPS.map((label, index) => {
//             const stepNumber = index + 1
//             const isDone = currentStep > stepNumber
//             const isActive = currentStep === stepNumber

//             return (
//               <div key={label} className="flex items-center">
//                 <div className="flex items-center gap-2">
//                   <span
//                     className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
//                       isDone || isActive
//                         ? 'bg-primary text-primary-foreground'
//                         : 'bg-muted text-muted-foreground'
//                     }`}
//                   >
//                     {isDone ? <Check className="h-4 w-4" /> : stepNumber}
//                   </span>
//                   <span
//                     className={`hidden text-sm font-medium sm:inline ${
//                       isActive ? 'text-foreground' : 'text-muted-foreground'
//                     }`}
//                   >
//                     {label}
//                   </span>
//                 </div>
//                 {index < STEPS.length - 1 && (
//                   <div
//                     className={`mx-3 h-0.5 w-8 sm:w-16 ${
//                       isDone ? 'bg-primary' : 'bg-border'
//                     }`}
//                   />
//                 )}
//               </div>
//             )
//           })}
//         </div>

//         <div className="mt-10 space-y-8">
//           {/* History Section (sirf logged-in user ko) */}
//           {user && showHistory && (
//             <HistorySection
//               items={history}
//               loading={historyLoading}
//               activeId={activeHistoryId}
//               onSelect={handleSelectHistory}
//               onDelete={handleDeleteHistory}
//             />
//           )}

//           {/* Upload Section */}
//           <div className="space-y-4">
//             <h2 className="text-2xl font-semibold text-foreground">Upload Audio</h2>
//             <UploadArea onFileUpload={handleFileUpload} />
//           </div>

//           {/* Audio Player Section */}
//           {audioFile && (
//             <div className="space-y-4">
//               <h2 className="text-2xl font-semibold text-foreground">Preview</h2>
//               <AudioPlayerPreview audioFile={audioFile} />
//             </div>
//           )}

//           {/* Language + Generate Summary */}
//           {audioFile && !results && (
//             <div className="flex flex-col items-center gap-4 pt-4">
//               <div className="flex items-center gap-3">
//                 <label
//                   htmlFor="language"
//                   className="text-sm font-medium text-muted-foreground"
//                 >
//                   Audio language
//                 </label>
//                 <select
//                   id="language"
//                   value={language}
//                   onChange={(e) => setLanguage(e.target.value)}
//                   disabled={isLoading}
//                   className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
//                 >
//                   {LANGUAGES.map((lang) => (
//                     <option key={lang.value} value={lang.value}>
//                       {lang.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <Button
//                 onClick={handleGenerateSummary}
//                 disabled={isLoading}
//                 size="lg"
//                 className="gap-2 px-12"
//               >
//                 {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
//                 {isLoading ? 'Generating Summary...' : 'Generate Summary'}
//               </Button>

//               {isLoading && (
//                 <p className="max-w-md text-center text-sm text-muted-foreground">
//                   {isSlow
//                     ? 'The server is starting up. The first request may take 30–60 seconds. Please wait...'
//                     : 'Transcribing and summarizing your audio...'}
//                 </p>
//               )}

//               {error && (
//                 <div
//                   role="alert"
//                   className="flex max-w-md items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
//                 >
//                   <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
//                   <span>{error}</span>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Results Section */}
//           {results && (
//             <div className="space-y-6 pt-8">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl font-semibold text-foreground">Results</h2>
//                   {user && activeHistoryId && (
//                     <p className="text-sm text-muted-foreground">Saved in your history</p>
//                   )}
//                 </div>
//                 <Button
//                   onClick={() => {
//                     setAudioFile(null)
//                     setResults(null)
//                     setError(null)
//                     setActiveHistoryId(null)
//                   }}
//                   variant="outline"
//                 >
//                   Upload New File
//                 </Button>
//               </div>
//               <ResultsSection results={results} />
//             </div>
//           )}
//         </div>
//       </div>

//       {showAuth && (
//         <AuthModal
//           key={authMode}
//           initialMode={authMode}
//           onClose={() => setShowAuth(false)}
//         />
//       )}
//     </main>
//   )
// }



'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, Check, Upload, Mic } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import UploadArea from '@/components/UploadArea'
import VoiceRecorder from '@/components/VoiceRecorder'
import AudioPlayerPreview from '@/components/AudioPlayerPreview'
import ResultsSection from '@/components/ResultsSection'
import AuthBar from '@/components/AuthBar'
import AuthModal from '@/components/AuthModal'
import HistorySection, { type HistoryItem } from '@/components/HistorySection'
import { supabase } from '@/lib/supabase'

const LANGUAGES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ur', label: 'Urdu' },
]

type InputMode = 'upload' | 'record'

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState('hi')
  const [results, setResults] = useState<{
    transcript: string
    summary: string[]
  } | null>(null)

  // Auth + history
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'reset'>('login')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  const userId = user?.id ?? null
  const currentStep = results ? 3 : audioFile ? 2 : 1
  const steps = [inputMode === 'record' ? 'Record' : 'Upload', 'Preview', 'Results']

  // Render free tier pe server sleep se uthne me time lagta hai
  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false)
      return
    }
    const timer = setTimeout(() => setIsSlow(true), 8000)
    return () => clearTimeout(timer)
  }, [isLoading])

  // Login state track karo
  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      // Reset password email link se wapas aane par naya password set karne ka form kholo
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset')
        setShowAuth(true)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchHistory = useCallback(async () => {
    if (!supabase) return
    setHistoryLoading(true)

    const { data, error } = await supabase
      .from('summaries')
      .select('id, filename, language, transcript, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('History fetch failed:', error.message)
    } else {
      setHistory((data as HistoryItem[]) ?? [])
    }
    setHistoryLoading(false)
  }, [])

  // Login hone par history load, logout par clear
  useEffect(() => {
    if (userId) {
      fetchHistory()
    } else {
      setHistory([])
      setShowHistory(false)
    }
  }, [userId, fetchHistory])

  const saveToHistory = async (
    file: File,
    transcript: string,
    summary: string[]
  ) => {
    // Guest ke liye kuch save nahi hota. Khali transcript (instrumental) bhi skip.
    if (!supabase || !user || !transcript.trim()) return

    const { data, error } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        filename: file.name,
        language,
        transcript,
        summary,
      })
      .select('id, filename, language, transcript, summary, created_at')
      .single()

    if (error) {
      console.error('Saving to history failed:', error.message)
      return
    }

    setHistory((prev) => [data as HistoryItem, ...prev])
    setActiveHistoryId((data as HistoryItem).id)
  }

  const handleDeleteHistory = async (id: string) => {
    if (!supabase) return

    const { error } = await supabase.from('summaries').delete().eq('id', id)
    if (error) {
      console.error('Delete failed:', error.message)
      return
    }

    setHistory((prev) => prev.filter((item) => item.id !== id))
    if (activeHistoryId === id) {
      setResults(null)
      setActiveHistoryId(null)
    }
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setAudioFile(null)
    setError(null)
    setResults({ transcript: item.transcript, summary: item.summary })
    setActiveHistoryId(item.id)
    setShowHistory(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    // Privacy: logout ke baad screen se saved data hata do
    setResults(null)
    setAudioFile(null)
    setActiveHistoryId(null)
    setShowHistory(false)
  }

  const handleModeChange = (mode: InputMode) => {
    if (mode === inputMode || isLoading) return

    setInputMode(mode)
    setAudioFile(null)
    setResults(null)
    setError(null)
    setActiveHistoryId(null)

    // Voice to script sirf English ke liye, upload me wapas default Hindi
    setLanguage(mode === 'record' ? 'en' : 'hi')
  }

  const handleFileUpload = (file: File) => {
    setAudioFile(file)
    setResults(null)
    setError(null)
    setActiveHistoryId(null)
  }

  const handleGenerateSummary = async () => {
    if (!audioFile) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('language', inputMode === 'record' ? 'en' : language)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-audio`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()

      const backendResults = {
        transcript: data.transcript ?? '',
        summary: data.summary || [
          'Summary will come from backend after processing',
        ],
      }

      setResults(backendResults)

      // Logged in ho to history me save karo (fail ho jaye to bhi results dikhte rahenge)
      await saveToHistory(audioFile, backendResults.transcript, backendResults.summary)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while processing your audio. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Login / Logout / History bar (sirf tab jab Supabase env set ho) */}
        {supabase && (
          <div className="mb-6">
            <AuthBar
              user={user}
              showHistory={showHistory}
              onLoginClick={() => {
                setAuthMode('login')
                setShowAuth(true)
              }}
              onLogout={handleLogout}
              onToggleHistory={() => setShowHistory((prev) => !prev)}
            />
          </div>
        )}

        <Header />

        {/* Step Indicator */}
        <div className="mt-10 flex items-center justify-center">
          {steps.map((label, index) => {
            const stepNumber = index + 1
            const isDone = currentStep > stepNumber
            const isActive = currentStep === stepNumber

            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isDone || isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : stepNumber}
                  </span>
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-3 h-0.5 w-8 sm:w-16 ${
                      isDone ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 space-y-8">
          {/* History Section (sirf logged-in user ko) */}
          {user && showHistory && (
            <HistorySection
              items={history}
              loading={historyLoading}
              activeId={activeHistoryId}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
            />
          )}

          {/* Input Section: Upload ya Record */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {inputMode === 'record' ? 'Record Voice' : 'Upload Audio'}
              </h2>

              <div
                role="tablist"
                aria-label="Input method"
                className="inline-flex rounded-lg border border-border bg-muted p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'upload'}
                  onClick={() => handleModeChange('upload')}
                  disabled={isLoading}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    inputMode === 'upload'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Audio
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'record'}
                  onClick={() => handleModeChange('record')}
                  disabled={isLoading}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    inputMode === 'record'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  Record Voice (English)
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <UploadArea onFileUpload={handleFileUpload} />
            ) : (
              <VoiceRecorder
                onRecordingComplete={handleFileUpload}
                disabled={isLoading}
              />
            )}
          </div>

          {/* Audio Player Section */}
          {audioFile && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Preview</h2>
              <AudioPlayerPreview audioFile={audioFile} />
            </div>
          )}

          {/* Language + Generate */}
          {audioFile && !results && (
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="language"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Audio language
                </label>
                {inputMode === 'record' ? (
                  <span className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    English
                  </span>
                ) : (
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isLoading}
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Button
                onClick={handleGenerateSummary}
                disabled={isLoading}
                size="lg"
                className="gap-2 px-12"
              >
                {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                {isLoading
                  ? inputMode === 'record'
                    ? 'Converting to Script...'
                    : 'Generating Summary...'
                  : inputMode === 'record'
                    ? 'Convert to Script'
                    : 'Generate Summary'}
              </Button>

              {isLoading && (
                <p className="max-w-md text-center text-sm text-muted-foreground">
                  {isSlow
                    ? 'Server start ho raha hai, pehli request me 30-60 seconds lag sakte hain. Thoda wait karein...'
                    : 'Transcribing and summarizing your audio...'}
                </p>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex max-w-md items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-6 pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Results</h2>
                  {user && activeHistoryId && (
                    <p className="text-sm text-muted-foreground">Saved in your history</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setAudioFile(null)
                    setResults(null)
                    setError(null)
                    setActiveHistoryId(null)
                  }}
                  variant="outline"
                >
                  {inputMode === 'record' ? 'Record Again' : 'Upload New File'}
                </Button>
              </div>
              <ResultsSection results={results} />
            </div>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          key={authMode}
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
        />
      )}
    </main>
  )
}