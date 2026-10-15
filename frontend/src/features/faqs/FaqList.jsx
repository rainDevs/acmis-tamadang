import { ChevronDown } from 'lucide-react'

// Native disclosure widgets: keyboard + screen-reader semantics free,
// no JS measurement, safe on old phones and with reduced motion.
const faqs = [
  {
    q: 'Do I need an account to request an appointment?',
    a: 'No. Fill in your name, contact number, service, and preferred date. You will receive a reference number — keep it safe, you need it to check your status.',
  },
  {
    q: 'Is my appointment approved right away?',
    a: 'No. Every request starts as pending. Health center staff review the schedule and capacity, then approve or advise you. Check your status page for the result.',
  },
  {
    q: 'How do I check my request status?',
    a: 'Open the status page and enter your reference number plus the last 4 digits of your contact number. Only the schedule and status are shown — never medical details.',
  },
  {
    q: 'What should I bring on my visit?',
    a: 'Bring any valid ID and your reference number. For immunization visits, bring the child\u2019s immunization card. Arrive a few minutes before your schedule.',
  },
  {
    q: 'What if I cannot come on my schedule?',
    a: 'Contact the health center as soon as possible so your slot can go to another patient. Cancellation and rescheduling rules are posted at the center.',
  },
  {
    q: 'Can I book online for an emergency?',
    a: 'No. Online booking is for routine requests only. For emergencies, severe symptoms, labor, or injuries, go directly to the health center or the nearest emergency facility.',
  },
]

export default function FaqList() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border bg-card shadow-sm">
      {faqs.map((f) => (
        <details key={f.q} className="group px-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-left text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  )
}
