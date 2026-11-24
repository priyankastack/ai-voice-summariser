// import { Mic } from 'lucide-react'

// export default function Header() {
//   return (
//     <header className="space-y-4">
//       <div className="flex items-center justify-center gap-3">
//         <div className="rounded-lg bg-primary p-3">
//           <Mic className="h-8 w-8 text-primary-foreground" />
//         </div>
//         <h1 className="text-4xl font-bold text-foreground">
//           Voice Note <span className="text-primary">Summarizer</span>
//         </h1>
//       </div>
//       <p className="text-center text-lg text-muted-foreground">
//         Transform your voice notes into concise summaries instantly
//       </p>
//     </header>
//   )
// }

import { Mic, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="space-y-5 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" />
        Powered by AI
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="rounded-xl bg-primary p-3 shadow-lg shadow-primary/30">
          <Mic className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Voice Note <span className="text-primary">Summarizer</span>
        </h1>
      </div>

      <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
        Transform your voice notes and songs into transcripts and concise summaries instantly
      </p>
    </header>
  )
}
