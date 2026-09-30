'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChartNoAxesCombined, Layers, LockKeyhole, MessageSquareText, MoveUpRight } from 'lucide-react'
import { Brand } from '@/components/layout/brand'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/hostlink'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const features = [
  { icon: Layers, title: 'One place for every project', description: 'Give every task a home and every teammate clarity.' },
  { icon: MessageSquareText, title: 'Less back-and-forth. More progress.', description: 'Keep conversations connected to the work.' },
  { icon: ChartNoAxesCombined, title: 'See the bigger picture', description: 'Know what’s moving, what’s next, and what needs you.' },
]

export function LoginPage() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [pending, setPending] = useState(false)
  function enterDemo() {
    setPending(true)
    router.push('/projects')
  }
  return <main className="grid min-h-svh bg-surface lg:grid-cols-[1.04fr_1fr]">
    <section className="login-brand-panel flex flex-col px-7 py-8 text-sidebar-foreground sm:px-12 lg:min-h-svh lg:px-16 lg:py-12 xl:px-20">
      <Link href="/" aria-label="Hostlink home" className="w-fit"><Brand inverse /></Link>
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} className="my-auto max-w-lg py-14 lg:py-20">
        <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/70"><span className="size-1.5 rounded-full bg-brand-500" />A little structure. A lot of possibility.</div>
        <h1 className="text-[clamp(2.6rem,4.3vw,4.25rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-inherit!">Where teams<br />host their <span className="text-brand-500">work.</span></h1>
        <p className="mt-6 max-w-sm text-base leading-7 text-sidebar-foreground/75">Bring your projects, people, and progress together. Make room for your team&apos;s best work.</p>
        <div className="mt-12 hidden flex-col gap-7 sm:flex">{features.map(({ icon: Icon, title, description }) => <div key={title} className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sidebar-foreground/15 bg-sidebar-foreground/5"><Icon className="size-5 text-brand-500" aria-hidden="true" /></span>
          <div><h2 className="text-sm font-medium text-inherit!">{title}</h2><p className="mt-1 text-[13px] leading-5 text-sidebar-foreground/65">{description}</p></div>
        </div>)}</div>
      </motion.div>
      <div className="hidden items-center justify-between gap-4 border-t border-sidebar-foreground/15 pt-6 text-xs text-sidebar-foreground/60 lg:flex"><span>A shared space. A shared direction.</span><MoveUpRight className="size-4" aria-hidden="true" /></div>
    </section>
    <section className="relative flex flex-col items-center justify-center px-6 py-14 sm:px-12 lg:py-24">
      <div className="mb-10 flex items-center gap-2 text-xs text-muted-foreground lg:absolute lg:top-12 lg:right-12 lg:mb-0"><span className="size-1.5 rounded-full bg-primary" />Your team&apos;s next chapter starts here</div>
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[360px]">
        <div className="mb-8"><span className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary"><span className="h-px w-6 bg-primary" />Welcome to Hostlink</span><h2 className="text-3xl font-semibold tracking-tight">Good work starts here.</h2><p className="mt-3 text-sm text-muted-foreground">Sign in to your team&apos;s workspace.</p></div>
        <form onSubmit={event => { event.preventDefault(); enterDemo() }} aria-label="Demo sign in" className="flex flex-col gap-6">
          <FieldGroup>
            <Field><FieldLabel htmlFor="email">Work email</FieldLabel><Input id="email" type="email" placeholder="you@company.com" autoComplete="off" required className="h-11" /></Field>
            <Field><FieldLabel htmlFor="password">Password</FieldLabel><Input id="password" type="password" placeholder="Enter a demo password" autoComplete="off" required className="h-11" /></Field>
          </FieldGroup>
          <LoadingButton type="submit" pending={pending} className="h-11 w-full">Sign in<ArrowRight data-icon="inline-end" /></LoadingButton>
        </form>
        <div className="my-6 flex items-center gap-4"><Separator className="flex-1" /><span className="shrink-0 text-xs text-muted-foreground">or take a look around</span><Separator className="flex-1" /></div>
        <Button variant="secondary" className="h-11 w-full" onClick={enterDemo} disabled={pending}>Continue as demo user<ArrowRight data-icon="inline-end" /></Button>
        <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>UI demo only. Use made-up credentials.<br />Nothing is authenticated, sent, or saved.</span></p>
      </motion.div>
      <p className="mt-12 text-xs text-muted-foreground lg:absolute lg:bottom-12">Built for small teams with big things to do.</p>
    </section>
  </main>
}
