import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Breadcrumb"><ol className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
    {index > 0 && <ChevronRight className="size-3 shrink-0" aria-hidden="true" />}
    {item.href ? <Link href={item.href} className="rounded outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{item.label}</Link> : <span className="truncate text-body" aria-current="page">{item.label}</span>}
  </li>)}</ol></nav>
}
