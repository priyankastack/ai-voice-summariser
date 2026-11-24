import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, FileAudio, Inbox } from 'lucide-react'

export interface HistoryItem {
  id: string
  filename: string
  language: string | null
  transcript: string
  summary: string[]
  created_at: string
}

interface HistorySectionProps {
  items: HistoryItem[]
  loading: boolean
  activeId: string | null
  onSelect: (item: HistoryItem) => void
  onDelete: (id: string) => void
}

export default function HistorySection({
  items,
  loading,
  activeId,
  onSelect,
  onDelete,
}: HistorySectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Your History</h2>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading history...
        </div>
      ) : items.length === 0 ? (
        <Card className="border border-border bg-card">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No saved summaries yet. Generate one and it will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`border bg-card transition-shadow hover:shadow-md ${
                activeId === item.id ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>

                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium text-foreground" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {item.language ? ` · ${item.language.toUpperCase()}` : ''}
                  </p>
                  {item.summary[0] && (
                    <p
                      dir="auto"
                      className="mt-1 line-clamp-1 text-sm text-muted-foreground"
                    >
                      {item.summary[0]}
                    </p>
                  )}
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${item.filename}`}
                  onClick={() => {
                    if (window.confirm('Delete this summary from your history?')) {
                      onDelete(item.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}