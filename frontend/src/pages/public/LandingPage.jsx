import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  Baby,
  CalendarPlus,
  ClipboardList,
  FileCheck,
  HeartPulse,
  Loader2,
  MessageSquareText,
  Search,
  ShieldCheck,
  Smartphone,
  CalendarCheck,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'
import AnnouncementList from '@/features/announcements/AnnouncementList'
import FaqList from '@/features/faqs/FaqList'
import HeroVisual from '@/features/landing/HeroVisual'
import StatsStrip from '@/features/landing/StatsStrip'
import CareSplit from '@/features/landing/CareSplit'
import RolesSplit from '@/features/landing/RolesSplit'
import { getServices } from '@/services/api'

// Structure follows the reference medical landing (topbar / hero + visual / stats /
// care split / specialty grid / team + values / board / FAQs / CTA / navy footer),
// rebuilt with project tokens and honest content only: no stock photos, no invented
// statistics, no patient testimonials.

const steps = [
  {
    icon: CalendarPlus,
    title: 'Send a request',
    text: 'Name, contact, service, and preferred date. No account needed — you get a reference number.',
  },
  {
    icon: ClipboardList,
    title: 'Staff review',
    text: 'Health center staff check schedule and capacity, then approve or advise on your request.',
  },
  {
    icon: Stethoscope,
    title: 'Visit & consult',
    text: 'Come on your schedule. Staff verify your identity and record the visit securely.',
  },
]

const serviceIcons = {
  general: Stethoscope,
  maternal: Baby,
  immunization: Syringe,
  senior: Users,
  bp: Activity,
  cert: FileCheck,
}

export default function LandingPage() {
  const [services, setServices] = useState([])
  const [svcState, setSvcState] = useState('loading')
  const reduce = useReducedMotion()

  useEffect(() => {
    let active = true
    getServices()
      .then((res) => {
        if (active) {
          setServices(res.data)
          setSvcState('ready')
        }
      })
      .catch(() => {
        if (active) setSvcState('error')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sky-50 dark:bg-slate-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_24rem_at_50%_-6rem,rgba(8,145,178,0.16),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-12 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:items-center">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Barangay Tamadang Health Center · Kiamba
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-white">
              Get expert care at your health center
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Request checkups from your phone — no account needed. Get a reference number, track your status, and arrive
              prepared.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-emerald-600 px-6 text-base transition-all duration-200 active:scale-[0.98] hover:bg-emerald-700">
                <Link to="/request">
                  <CalendarPlus className="size-5" aria-hidden="true" />
                  Book appointment
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 bg-white px-6 text-base transition-all duration-200 active:scale-[0.98] dark:bg-transparent">
                <Link to="/status">
                  <Search className="size-5" aria-hidden="true" />
                  Check status
                </Link>
              </Button>
            </div>
            <dl className="mt-6 flex flex-nowrap items-center gap-x-4 text-[11px] whitespace-nowrap text-slate-600 sm:gap-x-6 sm:text-sm dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Smartphone className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <dt className="sr-only">Account</dt>
                <dd>No account needed</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <dt className="sr-only">Review</dt>
                <dd>
                  <span className="sm:hidden">Staff-reviewed</span>
                  <span className="hidden sm:inline">Staff-reviewed requests</span>
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquareText className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <dt className="sr-only">Confirmation</dt>
                <dd>SMS confirmation</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="-mt-2 py-8">
          <StatsStrip serviceCount={svcState === 'ready' ? services.length : null} />
        </Reveal>
      </div>

      {/* Care split */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <CareSplit />
      </section>

      {/* Specialty / services */}
      <section className="bg-sky-50 dark:bg-slate-950" aria-labelledby="services">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            id="services"
            eyebrow="Our specialty"
            title="What you can request"
            description="Sample services for this demo. Final services, schedules, and daily capacity are set by the health center."
          />
          <div className="mt-8" aria-live="polite">
            {svcState === 'loading' ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading services…
              </p>
            ) : svcState === 'error' ? (
              <p role="alert" className="mx-auto max-w-md rounded-xl border bg-card px-4 py-3 text-center text-sm">
                Could not load services right now. Please try again later.
              </p>
            ) : services.length === 0 ? (
              <p className="mx-auto max-w-md rounded-xl border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
                No services published yet.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s, i) => {
                  const Icon = serviceIcons[s.id] || HeartPulse
                  return (
                    <motion.li
                      key={s.id}
                      className="flex list-none flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      initial={reduce ? false : { opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-64px' }}
                      transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: 'easeOut' }}
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" aria-hidden="true">
                        <Icon className="size-6" />
                      </span>
                      <h3 className="mt-3 text-base font-bold">{s.name}</h3>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                      <p className="mt-3 text-xs text-muted-foreground">About {s.duration_minutes} min per visit</p>
                      <Button asChild variant="outline" size="sm" className="mt-4 h-10 w-full">
                        <Link to="/request">Request this service</Link>
                      </Button>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="how">
        <SectionHeading
          id="how"
          eyebrow="How it works"
          title="Three simple steps"
          description="The same workflow our staff follows — from your phone to the consultation room."
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative flex h-full list-none items-start gap-3 overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-64px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' }}
            >
              <span aria-hidden="true" className="pointer-events-none absolute -top-2 right-3 text-6xl font-extrabold text-muted/80 select-none">
                {i + 1}
              </span>
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-800 dark:text-emerald-300" aria-hidden="true">
                <s.icon className="size-5" />
              </span>
              <div>
                <h3 className="relative text-base font-bold">{s.title}</h3>
                <p className="relative mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Team roles + values */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <RolesSplit />
        </div>
      </section>

      {/* Announcements */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="announcements">
        <SectionHeading
          id="announcements"
          eyebrow="Bulletin board"
          title="Announcements"
          description="Schedules, holiday notices, and reminders from the health center. Pinned items first."
        />
        <div className="mt-8">
          <AnnouncementList />
        </div>
      </section>

      {/* FAQs + CTA */}
      <section className="border-t bg-muted/40" aria-labelledby="faqs">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            id="faqs"
            eyebrow="Good to know"
            title="Frequently asked questions"
            description="Quick answers before you send a request. Still unsure? Ask the health center directly."
          />
          <Reveal className="mt-8">
            <FaqList />
          </Reveal>
          <Reveal>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="note">
              <p className="font-bold">Privacy & urgent care notice</p>
              <p className="mt-1">
                We collect only what is needed to process your request. For emergencies, severe symptoms, labor, or injuries — do not
                book online. Go directly to the health center or nearest emergency facility.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-8 overflow-hidden rounded-2xl bg-emerald-800 px-6 py-10 text-center text-white shadow-lg sm:px-12">
              <h2 className="mx-auto max-w-xl text-2xl font-extrabold text-balance sm:text-3xl">
                Ready when you are. Your health center, one tap away.
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-emerald-100 sm:text-base">
                Send a request in minutes and keep your reference number safe — staff handle the rest.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  <Link to="/request">
                    <CalendarPlus className="size-5" aria-hidden="true" />
                    Start your request
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-8 text-base text-white transition-colors duration-200 hover:bg-white/10 hover:text-white">
                  <Link to="/status">
                    <Search className="size-5" aria-hidden="true" />
                    Check status
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
