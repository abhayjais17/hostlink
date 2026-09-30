import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={cn('size-8 shrink-0', className)}>
    <rect width="32" height="32" rx="8" className="fill-brand-600" />
    <path d="M14 8H11a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h3v-8H7" stroke="#F0FDFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 24h3a4 4 0 0 0 4-4v-8a4 4 0 0 0-4-4h-3v8h7" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16h4" stroke="#F0FDFA" strokeWidth="3" />
  </svg>
}

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <span className={cn('inline-flex items-center gap-2.5', inverse ? 'text-sidebar-foreground' : 'text-strong')}>
    <BrandMark />
    {!compact && <span className="text-xl font-semibold tracking-tight">Hostlink<span className="text-brand-500">.</span></span>}
  </span>
}
