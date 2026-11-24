'use client'

import { useEffect, useState } from 'react'
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

interface AuthModalProps {
  onClose: () => void
  initialMode?: 'login' | 'reset'
}

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const TITLES: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to save and view your summary history.',
  },
  signup: {
    title: 'Create account',
    subtitle: 'Sign up to save your summaries and access them anytime.',
  },
  forgot: {
    title: 'Forgot password?',
    subtitle: "Enter your email and we'll send you a link to reset your password.",
  },
  reset: {
    title: 'Set a new password',
    subtitle: 'Choose a strong password for your account.',
  },
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function AuthModal({ onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const needsStrongPassword = mode === 'signup' || mode === 'reset'
  const allRulesPass = PASSWORD_RULES.every((rule) => rule.test(password))
  const passwordsMatch = password === confirmPassword
  const canSubmit =
    !loading &&
    (!needsStrongPassword ||
      (allRulesPass && passwordsMatch && confirmPassword.length > 0))

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfo(null)
    setPassword('')
    setConfirmPassword('')
  }

  const friendlyError = (message: string) => {
    const m = message.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
    if (m.includes('email not confirmed'))
      return 'Please confirm your email first. Check your inbox for the verification link.'
    if (m.includes('already registered')) return 'An account with this email already exists.'
    return message
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) {
      setError('Login is not configured yet.')
      return
    }

    if (needsStrongPassword) {
      if (!allRulesPass) {
        setError('Password does not meet all the requirements.')
        return
      }
      if (!passwordsMatch) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onClose()
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error

        // Email pehle se registered ho to Supabase bina error ke empty identities deta hai
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('An account with this email already exists.')
        }

        if (data.session) {
          onClose()
        } else {
          switchMode('login')
          setInfo(
            'Account created. We sent a verification link to your email. Please verify your email, then log in.'
          )
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo(
          'If an account exists for this email, a password reset link has been sent. Please check your inbox.'
        )
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        onClose()
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  const submitLabel =
    mode === 'login'
      ? 'Log in'
      : mode === 'signup'
        ? 'Sign up'
        : mode === 'forgot'
          ? 'Send reset link'
          : 'Update password'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6"
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-md border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">{TITLES[mode].title}</h2>
            <p className="text-sm text-muted-foreground">{TITLES[mode].subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset' && (
              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <PasswordField
                id="auth-password"
                label={mode === 'reset' ? 'New password' : 'Password'}
                value={password}
                onChange={setPassword}
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {needsStrongPassword && (
              <>
                <ul className="space-y-1 rounded-lg bg-muted/50 p-3">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs ${
                          passed ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {passed ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>

                <PasswordField
                  id="auth-confirm-password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />

                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{info}</span>
              </div>
            )}

            <Button type="submit" size="lg" disabled={!canSubmit} className="w-full gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium text-primary hover:underline"
              >
                Log in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium text-primary hover:underline"
              >
                Back to log in
              </button>
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}