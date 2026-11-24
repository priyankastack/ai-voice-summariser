'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void
  disabled?: boolean
}

// 25MB (Groq limit) se bahut neeche rehne ke liye max 10 minute
const MAX_SECONDS = 600

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

function extensionFor(mime: string): string {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function VoiceRecorder({
  onRecordingComplete,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  // Page chhodte waqt mic band karo (aur adhuri recording bhejo mat)
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }
      cleanup()
    }
  }, [])

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
  }

  // 10 minute hone par auto stop
  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) {
      stopRecording()
    }
  }, [seconds, isRecording])

  const startRecording = async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(
        'Your browser does not support voice recording. Please use the latest Chrome, Edge, Firefox or Safari.'
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const rawType = recorder.mimeType || mimeType || 'audio/webm'
        const type = rawType.split(';')[0]
        const blob = new Blob(chunksRef.current, { type })

        cleanup()
        setIsRecording(false)

        if (blob.size === 0) {
          setError('No audio was captured. Please try again.')
          return
        }

        const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
        const file = new File([blob], `voice-recording-${stamp}.${extensionFor(type)}`, {
          type,
        })
        onRecordingComplete(file)
      }

      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setIsRecording(true)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err) {
      cleanup()
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            'Microphone permission denied. Please allow microphone access in your browser and try again.'
          )
          return
        }
        if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.')
          return
        }
      }
      setError('Could not start recording. Please try again.')
    }
  }

  return (
    <div className="space-y-3">
      <Card className="border-2 border-dashed border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-12 sm:px-12 sm:py-14">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
              isRecording
                ? 'animate-pulse bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:scale-105'
            }`}
          >
            {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-9 w-9" />}
          </button>

          <div className="space-y-1 text-center">
            <h3 className="text-xl font-semibold text-foreground">
              {isRecording ? 'Recording...' : 'Tap the mic and start speaking'}
            </h3>
            {isRecording ? (
              <p className="text-2xl font-semibold tabular-nums text-red-600">
                {formatTime(seconds)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Speak in English. Tap the button again to stop.
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Max recording time: {MAX_SECONDS / 60} minutes
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