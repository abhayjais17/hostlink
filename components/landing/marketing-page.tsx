'use client'

import { useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ChartNoAxesCombined, Check, CircleCheck, Clock3, Columns3, ListFilter, MessageSquareText, Quote, Users } from 'lucide-react'
import { Brand } from '@/components/layout/brand'
import { buttonVariants } from '@/components/ui/button'
import { ProductPreview } from './product-preview'
import { cn } from '@/lib/utils'

const ease = [0.2, 0.8, 0.2, 1] as const
const features = [
  { icon: Columns3, title: 'A clear path from idea to done.', label: 'KANBAN BOARDS', description: 'Give every task a place. Move work through Backlog, In Progress, Review, and Done, with thoughtful guardrails that keep your team\'s process on track.' },
  { icon: ListFilter, title: 'The details, without the digging.', label: 'LIST VIEW & FILTERS', description: 'Switch to a focused list, sort by priority or due date, and filter by teammate or status. Your filters follow you between views.' },
  { icon: MessageSquareText, title: 'Keep the conversation connected.', label: 'TASK COMMENTS', description: 'Discuss decisions right where the work happens. A shared comment thread and activity history give everyone the context to move forward.' },
  { icon: Clock3, title: 'Catch the things that can\'t wait.', label: 'OVERDUE TRACKING', description: 'Spot overdue work at a glance with clear flags and due dates. When a task is done, the overdue flag disappears—one less thing to worry about.' },
  { icon: ChartNoAxesCombined, title: 'Less guessing. More perspective.', label: 'PROJECT ANALYTICS', description: 'See completion, follow your team\'s burndown, and balance workload. A clearer picture of progress helps you decide what needs attention next.' },
]
const steps = [
  { number: '01', title: 'Give your work a home.', text: 'Create a project, bring your teammates in, and turn a big idea into manageable tasks.' },
  { number: '02', title: 'Find your shared rhythm.', text: 'Set owners, priorities, and due dates. Choose a board or list to see work your way.' },
  { number: '03', title: 'Make progress, together.', text: 'Move tasks through review to done. Keep ownership clear and your next step in sight.' },
]

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : delay, ease }} className={className}>{children}</motion.div>
}

function LoginLink({ children, secondary = false }: { children: ReactNode; secondary?: boolean }) {
  return <Link href="/login" className={cn(buttonVariants({ variant: secondary ? 'secondary' : 'default', size: 'lg' }), 'h-11 gap-2 px-6')}>{children}</Link>
}

export function MarketingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const heroVisible = useInView(heroRef, { margin: '-72px 0px 0px 0px' })
  const reduced = useReducedMotion()
  const entrance = { initial: reduced ? false as const : { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduced ? 0 : 0.25, ease } }

  return <div className="bg-surface">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3 focus:text-primary">Skip to content</a>
    <header data-scrolled={!heroVisible} className={cn('sticky top-0 z-30 border-b transition-[background-color,box-shadow] duration-200', heroVisible ? 'border-border/60 bg-surface' : 'border-border bg-surface/95 shadow-md backdrop-blur-lg')}>
      <nav aria-label="Main navigation" className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Hostlink home"><Brand /></Link>
        <div className="hidden items-center gap-8 text-[13px] font-medium text-body md:flex"><a className="transition-colors hover:text-primary" href="#features">Features</a><a className="transition-colors hover:text-primary" href="#how-it-works">How it works</a><a className="transition-colors hover:text-primary" href="#teams">Made for teams</a></div>
        <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-9 px-4')}>Sign in<ArrowRight data-icon="inline-end" /></Link>
      </nav>
    </header>
    <main id="main-content">
      <section ref={heroRef} className="login-brand-panel overflow-hidden text-sidebar-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-12 lg:py-24">
          <div>
            <motion.p {...entrance} className="mb-6 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.17em] text-sidebar-foreground/75 sm:text-xs"><span className="size-1.5 rounded-full bg-brand-500" />A little structure. A lot of possibility.</motion.p>
            <motion.h1 {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : 0.06 }} className="max-w-xl text-[clamp(2.8rem,4.8vw,4.7rem)] font-semibold leading-[1.08] tracking-[-0.05em] text-inherit!">Where teams<br />host their <span className="text-brand-500">work.</span></motion.h1>
            <motion.p {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : 0.1 }} className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/75">Bring your projects, people, and progress together. A focused workspace for small teams—and the big things they want to do.</motion.p>
            <motion.div {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : 0.15 }} className="mt-8 flex flex-wrap gap-3"><LoginLink>Get started<ArrowRight data-icon="inline-end" /></LoginLink><LoginLink secondary>Sign in</LoginLink></motion.div>
            <motion.div {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : 0.2 }} className="mt-5 flex flex-col items-start gap-2 text-xs text-sidebar-foreground/65"><p>No setup. No credit card. Just a little clarity.</p><Link href="/login" className="inline-flex items-center gap-1.5 text-sidebar-foreground/90 underline underline-offset-4 hover:text-brand-500">Continue as demo user<ArrowRight className="size-3" /></Link></motion.div>
          </div>
          <motion.div {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : 0.18 }} className="min-w-0"><ProductPreview /><p className="mt-4 text-center text-[11px] text-sidebar-foreground/60">Less chasing updates. More moving forward.</p></motion.div>
        </div>
        <div className="border-t border-sidebar-foreground/10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 text-xs text-sidebar-foreground/70 sm:px-8 lg:px-12"><span>A shared space. A shared direction.</span><a href="#features" className="flex items-center gap-2 text-sidebar-foreground hover:text-brand-500">Meet your new workspace<ArrowDown className="size-3.5" /></a></div></div>
      </section>
      <section aria-label="Built for your team" className="border-b bg-brand-50/50"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 py-8 text-sm text-primary sm:px-8"><span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Small teams. Shared ambition.</span>{['Design teams', 'Product teams', 'Development teams'].map(team => <span key={team} className="flex items-center gap-2 font-medium"><Users className="size-4" />{team}</span>)}</div></section>
      <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-6xl"><Reveal className="mb-12 max-w-2xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">Everything connected</p><h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Big-picture clarity.<br />Down-to-the-task detail.</h2><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Not another place to check. One place to see what matters, know who owns it, and keep the whole team moving.</p></Reveal>
          <div className="grid gap-x-10 gap-y-5 md:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, label, description }, i) => <Reveal key={label} delay={(i % 3) * 0.04} className="h-full"><motion.article whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.18, ease }} className="flex h-full flex-col items-start rounded-xl border bg-surface p-6 shadow-sm"><div className="mb-6 flex size-11 items-center justify-center rounded-lg bg-brand-50 text-primary"><Icon className="size-5" aria-hidden="true" /></div><div className="mb-2 flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold tracking-widest text-primary">{label}</p></div><h3 className="text-lg font-semibold leading-6 tracking-tight">{title}</h3><p className="mt-3 text-[13px] leading-6 text-muted-foreground">{description}</p></motion.article></Reveal>)}
            <Reveal className="h-full"><div className="flex h-full flex-col justify-between gap-8 rounded-xl bg-brand-50 p-7"><div><CircleCheck className="mb-5 size-7 text-primary" /><h3 className="text-2xl font-semibold leading-tight tracking-tight">Less complexity.<br />More possibility.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Enough structure to stay aligned. Enough space to do things your way.</p></div><Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Explore the demo<ArrowRight className="size-4" /></Link></div></Reveal>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="scroll-mt-24 border-y bg-canvas px-5 py-20 sm:px-8 sm:py-24 lg:px-12"><div className="mx-auto max-w-6xl"><Reveal className="text-center"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">A little structure goes a long way</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From "what\'s the plan?" to "done."</h2><p className="mt-4 text-base text-muted-foreground">A simple rhythm for your team\'s best work.</p></Reveal><div className="mt-14 grid gap-9 md:grid-cols-3">{steps.map(step => <Reveal key={step.number}><div className="mb-6 flex items-center gap-4"><span className="text-4xl font-light tracking-tight text-primary/60">{step.number}</span><span className="h-px flex-1 bg-border" /></div><h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{step.text}</p></Reveal>)}</div></div></section>
      <section id="teams" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"><div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-20"><Reveal><p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary">Made for working together</p><h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">A smaller tool.<br />A bigger sense of together.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">For teams that have outgrown scattered chat threads, but don\'t need another complicated system.</p><ul className="mt-6 flex flex-col gap-3 text-sm">{['Clear owners, not endless follow-ups', 'Shared context, not scattered conversations', 'Visible progress, not status-meeting guesswork'].map(text => <li key={text} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-primary" />{text}</li>)}</ul></Reveal><Reveal><figure className="rounded-2xl border bg-brand-50/50 p-8 sm:p-10"><Quote className="mb-6 size-9 text-primary" aria-hidden="true" /><blockquote className="text-xl font-medium leading-relaxed tracking-tight text-strong sm:text-2xl">"Less \'where are we on this?\' More knowing exactly what comes next. That\'s the kind of workspace we want for our team."</blockquote><figcaption className="mt-8 border-t pt-6"><p className="font-semibold text-strong">A small team with a shared goal</p><p className="mt-1 text-xs text-muted-foreground">Illustrative testimonial · Sample content, not a customer endorsement.</p></figcaption></figure></Reveal></div></section>
      <section className="login-brand-panel px-5 py-16 text-sidebar-foreground sm:px-8 sm:py-20"><Reveal className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-sidebar-foreground/65">Your next chapter starts here</p><h2 className="text-3xl font-semibold tracking-tight text-inherit! sm:text-4xl">Give good work a place to grow.</h2><p className="mt-4 text-base text-sidebar-foreground/70">Your projects. Your people. All moving in the same direction.</p></div><div className="flex shrink-0 flex-col items-start gap-3"><LoginLink secondary>Get started<ArrowRight data-icon="inline-end" /></LoginLink><span className="text-xs text-sidebar-foreground/65">Explore the interactive demo.</span></div></Reveal></section>
    </main>
    <footer className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-12"><div className="flex flex-col justify-between gap-8 sm:flex-row"><div><Link href="/" aria-label="Hostlink home"><Brand /></Link><p className="mt-3 text-xs text-muted-foreground">Where teams host their work.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap items-start gap-x-7 gap-y-3 text-sm"><a href="#features" className="hover:text-primary">Features</a><a href="#how-it-works" className="hover:text-primary">How it works</a><a href="#teams" className="hover:text-primary">For teams</a><Link href="/login" className="hover:text-primary">Sign in</Link></nav></div><div className="mt-8 flex flex-wrap justify-between gap-3 border-t pt-5 text-[11px] text-muted-foreground"><p>© {new Date().getFullYear()} Hostlink. All rights reserved.</p><p>Demo preview · No real accounts or persistent storage.</p></div></footer>
  </div>
}
