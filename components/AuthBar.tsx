import { History, LogIn, LogOut, User as UserIcon } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

interface AuthBarProps {
  user: User | null
  showHistory: boolean
  onLoginClick: () => void
  onLogout: () => void
  onToggleHistory: () => void
}

export default function AuthBar({
  user,
  showHistory,
  onLoginClick,
  onLogout,
  onToggleHistory,
}: AuthBarProps) {
  if (!user) {
    return (
      <div className="flex items-center justify-end gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Log in to save your summary history
        </span>
        <Button variant="outline" size="sm" onClick={onLoginClick} className="gap-2">
          <LogIn className="h-4 w-4" />
          Log in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="flex max-w-[200px] items-center gap-2 text-sm text-muted-foreground">
        <UserIcon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate" title={user.email ?? ''}>
          {user.email}
        </span>
      </span>
      <Button
        variant={showHistory ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleHistory}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        History
      </Button>
      <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  )
}